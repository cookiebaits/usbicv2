import { getDb, generateId } from '@/lib/database';

export interface ITransaction {
  id: string;
  _id: string;
  userId: string | any;
  description: string;
  amount: number;
  date: string;
  type: string;
  category: string;
  accountType: string;
  status: string;
  cryptoAmount?: number;
  cryptoPrice?: number;
  recipientWallet?: string;
  memo?: string;
  relatedTransactionId?: string;
  transferId?: string;
  zellePersonInfo?: any;
}

function rowToTransaction(row: any): ITransaction | null {
  if (!row) return null;
  return {
    ...row,
    _id: row.id,
    zellePersonInfo: row.zellePersonInfo ? JSON.parse(row.zellePersonInfo) : undefined,
  };
}

const Transaction = {
  findOne(query: Record<string, any>): ITransaction | null {
    const db = getDb();
    const { conditions, values } = buildWhere(query);
    if (conditions.length === 0) return null;
    const row = db.prepare(`SELECT * FROM transactions WHERE ${conditions.join(' AND ')} LIMIT 1`).get(...values);
    return rowToTransaction(row);
  },

  findById(id: string): ITransaction | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    return rowToTransaction(row);
  },

  find(query?: Record<string, any>): ITransaction[] {
    const db = getDb();
    if (!query || Object.keys(query).length === 0) {
      return db.prepare('SELECT * FROM transactions ORDER BY date DESC').all().map(rowToTransaction).filter(Boolean) as ITransaction[];
    }
    const { conditions, values } = buildWhere(query);
    if (conditions.length === 0) {
      return db.prepare('SELECT * FROM transactions ORDER BY date DESC').all().map(rowToTransaction).filter(Boolean) as ITransaction[];
    }
    return db.prepare(`SELECT * FROM transactions WHERE ${conditions.join(' AND ')} ORDER BY date DESC`).all(...values).map(rowToTransaction).filter(Boolean) as ITransaction[];
  },

  findSorted(query: Record<string, any>, sort: Record<string, number>, limit?: number): ITransaction[] {
    const db = getDb();
    const { conditions, values } = buildWhere(query);
    const orderBy = Object.entries(sort).map(([k, v]) => `${k} ${v === -1 ? 'DESC' : 'ASC'}`).join(', ');
    let sql = conditions.length > 0 
      ? `SELECT * FROM transactions WHERE ${conditions.join(' AND ')} ORDER BY ${orderBy}`
      : `SELECT * FROM transactions ORDER BY ${orderBy}`;
    if (limit) sql += ` LIMIT ${limit}`;
    return (conditions.length > 0 ? db.prepare(sql).all(...values) : db.prepare(sql).all()).map(rowToTransaction).filter(Boolean) as ITransaction[];
  },

  // Find with populated user data (JOIN)
  findPopulated(query?: Record<string, any>): any[] {
    const db = getDb();
    let sql = `SELECT t.*, u.fullName as user_fullName, u.email as user_email, 
               u.accountNumber as user_accountNumber, u.savingsNumber as user_savingsNumber
               FROM transactions t LEFT JOIN users u ON t.userId = u.id`;
    
    if (query && Object.keys(query).length > 0) {
      const { conditions, values } = buildWhere(query, 't');
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
        return db.prepare(sql).all(...values).map(row => populateRow(row));
      }
    }
    return db.prepare(sql).all().map(row => populateRow(row));
  },

  findByIdPopulated(id: string): any | null {
    const db = getDb();
    const row = db.prepare(`
      SELECT t.*, u.fullName as user_fullName, u.email as user_email,
             u.accountNumber as user_accountNumber, u.savingsNumber as user_savingsNumber
      FROM transactions t LEFT JOIN users u ON t.userId = u.id
      WHERE t.id = ?
    `).get(id);
    return row ? populateRow(row) : null;
  },

  findPopulatedByIds(ids: string[]): any[] {
    const db = getDb();
    const placeholders = ids.map(() => '?').join(',');
    return db.prepare(`
      SELECT t.*, u.fullName as user_fullName, u.email as user_email,
             u.accountNumber as user_accountNumber, u.savingsNumber as user_savingsNumber,
             u.balance as user_balance, u.savingsBalance as user_savingsBalance,
             u.cryptoBalance as user_cryptoBalance
      FROM transactions t LEFT JOIN users u ON t.userId = u.id
      WHERE t.id IN (${placeholders})
    `).all(...ids).map(row => populateRow(row));
  },

  create(data: Partial<ITransaction> | Partial<ITransaction>[]): ITransaction | ITransaction[] {
    const db = getDb();
    if (Array.isArray(data)) {
      return data.map(d => createOne(db, d));
    }
    return createOne(db, data);
  },

  save(tx: ITransaction): ITransaction {
    const db = getDb();
    db.prepare(`
      UPDATE transactions SET description=?, amount=?, date=?, type=?, category=?,
        accountType=?, status=?, cryptoAmount=?, cryptoPrice=?, recipientWallet=?,
        memo=?, relatedTransactionId=?, transferId=?, zellePersonInfo=?
      WHERE id=?
    `).run(
      tx.description, tx.amount, tx.date, tx.type, tx.category,
      tx.accountType, tx.status, tx.cryptoAmount ?? null, tx.cryptoPrice ?? null,
      tx.recipientWallet ?? null, tx.memo ?? null, tx.relatedTransactionId ?? null,
      tx.transferId ?? null, tx.zellePersonInfo ? JSON.stringify(tx.zellePersonInfo) : null,
      tx.id
    );
    return Transaction.findById(tx.id)!;
  },

  insertMany(docs: any[]): void {
    const db = getDb();
    for (const d of docs) {
      createOne(db, d);
    }
  },

  deleteOne(query: Record<string, any>): void {
    const db = getDb();
    if (query._id) {
      db.prepare('DELETE FROM transactions WHERE id = ?').run(query._id);
    }
  },

  deleteMany(query: Record<string, any>): void {
    const db = getDb();
    if (query._id && query._id.$in) {
      const ids = query._id.$in.map((id: any) => id.toString ? id.toString() : id);
      const placeholders = ids.map(() => '?').join(',');
      db.prepare(`DELETE FROM transactions WHERE id IN (${placeholders})`).run(...ids);
    } else if (query.transferId) {
      db.prepare('DELETE FROM transactions WHERE transferId = ?').run(query.transferId);
    }
  }
};

function createOne(db: any, data: Partial<ITransaction>): ITransaction {
  const id = (data as any).id || generateId();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO transactions (id, userId, description, amount, date, type, category,
      accountType, status, cryptoAmount, cryptoPrice, recipientWallet, memo,
      relatedTransactionId, transferId, zellePersonInfo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    typeof data.userId === 'object' ? data.userId._id || data.userId.id || data.userId : data.userId,
    data.description || '',
    data.amount || 0,
    data.date || now,
    data.type || '',
    data.category || '',
    data.accountType || '',
    data.status || 'completed',
    data.cryptoAmount ?? null,
    data.cryptoPrice ?? null,
    data.recipientWallet ?? null,
    data.memo ?? null,
    data.relatedTransactionId ?? null,
    data.transferId ?? null,
    data.zellePersonInfo ? JSON.stringify(data.zellePersonInfo) : null
  );
  return Transaction.findById(id)!;
}

function buildWhere(query: Record<string, any>, prefix?: string): { conditions: string[]; values: any[] } {
  const conditions: string[] = [];
  const values: any[] = [];
  const p = prefix ? `${prefix}.` : '';
  
  for (const [key, val] of Object.entries(query)) {
    if (key === '$or') {
      const orParts: string[] = [];
      for (const subQ of val) {
        for (const [sk, sv] of Object.entries(subQ)) {
          orParts.push(`${p}${sk} = ?`);
          values.push(sv);
        }
      }
      if (orParts.length > 0) conditions.push(`(${orParts.join(' OR ')})`);
    } else if (typeof val === 'object' && val !== null) {
      if (val.$in) {
        const ids = val.$in.map((id: any) => id.toString ? id.toString() : id);
        const placeholders = ids.map(() => '?').join(',');
        conditions.push(`${p}${key === '_id' ? 'id' : key} IN (${placeholders})`);
        values.push(...ids);
      } else if (val.$ne !== undefined) {
        conditions.push(`${p}${key} != ?`);
        values.push(val.$ne);
      } else if (val.$exists !== undefined) {
        // Skip $exists for SQLite
      }
    } else {
      const col = key === '_id' ? 'id' : key;
      conditions.push(`${p}${col} = ?`);
      values.push(val);
    }
  }
  
  return { conditions, values };
}

function populateRow(row: any): any {
  if (!row) return null;
  const tx = rowToTransaction(row);
  if (!tx) return null;
  
  // Replace userId with populated user object
  (tx as any).userId = {
    _id: row.userId,
    id: row.userId,
    fullName: row.user_fullName || 'Unknown User',
    email: row.user_email || 'N/A',
    accountNumber: row.user_accountNumber || 'N/A',
    savingsNumber: row.user_savingsNumber || 'N/A',
    balance: row.user_balance,
    savingsBalance: row.user_savingsBalance,
    cryptoBalance: row.user_cryptoBalance,
  };
  
  return tx;
}

export default Transaction;
