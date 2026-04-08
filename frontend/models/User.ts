import { getDb, generateId } from '@/lib/database';
import bcrypt from 'bcryptjs';

export interface IUser {
  id: string;
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  ssn: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  username: string;
  password: string;
  balance: number;
  savingsBalance: number;
  cryptoBalance: number;
  status: string;
  twoFactorEnabled: boolean;
  lastLogin: string | null;
  accountNumber: string;
  savingsNumber: string;
  cryptoNumber: string;
  verificationCode: string | null;
  twoFactorCode: string | null;
  twoFactorCodeExpires: string | null;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: string;
  pendingTransfer: any;
  pendingExternalTransfer: any;
  pendingZelleTransfer: any;
  pendingCryptoTransfer: any;
}

function rowToUser(row: any): IUser | null {
  if (!row) return null;
  return {
    ...row,
    _id: row.id,
    twoFactorEnabled: !!row.twoFactorEnabled,
    isVerified: !!row.isVerified,
    isApproved: row.isApproved === undefined ? true : !!row.isApproved,
    pendingTransfer: row.pendingTransfer ? JSON.parse(row.pendingTransfer) : undefined,
    pendingExternalTransfer: row.pendingExternalTransfer ? JSON.parse(row.pendingExternalTransfer) : undefined,
    pendingZelleTransfer: row.pendingZelleTransfer ? JSON.parse(row.pendingZelleTransfer) : undefined,
    pendingCryptoTransfer: row.pendingCryptoTransfer ? JSON.parse(row.pendingCryptoTransfer) : undefined,
  };
}

const User = {
  findOne(query: Record<string, any>): IUser | null {
    const db = getDb();
    const keys = Object.keys(query);
    if (keys.length === 0) return null;
    
    // Handle $or queries
    if (query.$or) {
      const conditions = query.$or.map((q: any) => {
        const k = Object.keys(q)[0];
        return `${k} = ?`;
      });
      const values = query.$or.map((q: any) => Object.values(q)[0]);
      const row = db.prepare(`SELECT * FROM users WHERE ${conditions.join(' OR ')} LIMIT 1`).get(...values);
      return rowToUser(row);
    }
    
    const where = keys.map(k => `${k} = ?`).join(' AND ');
    const values = keys.map(k => query[k]);
    const row = db.prepare(`SELECT * FROM users WHERE ${where} LIMIT 1`).get(...values);
    return rowToUser(row);
  },

  findById(id: string): IUser | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return rowToUser(row);
  },

  find(query?: Record<string, any>): IUser[] {
    const db = getDb();
    if (!query || Object.keys(query).length === 0) {
      return db.prepare('SELECT * FROM users').all().map(rowToUser).filter(Boolean) as IUser[];
    }
    const keys = Object.keys(query);
    const where = keys.map(k => `${k} = ?`).join(' AND ');
    const values = keys.map(k => query[k]);
    return db.prepare(`SELECT * FROM users WHERE ${where}`).all(...values).map(rowToUser).filter(Boolean) as IUser[];
  },

  create(data: Partial<IUser>): IUser {
    const db = getDb();
    const id = data.id || generateId();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO users (id, fullName, email, phone, ssn, streetAddress, city, state, zipCode,
        username, password, balance, savingsBalance, cryptoBalance, status, twoFactorEnabled,
        lastLogin, accountNumber, savingsNumber, cryptoNumber, verificationCode, twoFactorCode,
        twoFactorCodeExpires, isVerified, isApproved, createdAt, pendingTransfer,
        pendingExternalTransfer, pendingZelleTransfer, pendingCryptoTransfer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.fullName || '',
      data.email || '',
      data.phone || '',
      data.ssn || '',
      data.streetAddress || '',
      data.city || '',
      data.state || '',
      data.zipCode || '',
      data.username || '',
      data.password || '',
      data.balance || 0,
      data.savingsBalance || 0,
      data.cryptoBalance || 0,
      data.status || 'active',
      data.twoFactorEnabled === false ? 0 : 1,
      data.lastLogin || null,
      data.accountNumber || null,
      data.savingsNumber || null,
      data.cryptoNumber || null,
      data.verificationCode || null,
      data.twoFactorCode || null,
      data.twoFactorCodeExpires || null,
      data.isVerified ? 1 : 0,
      data.isApproved === false ? 0 : 1,
      data.createdAt || now,
      data.pendingTransfer ? JSON.stringify(data.pendingTransfer) : null,
      data.pendingExternalTransfer ? JSON.stringify(data.pendingExternalTransfer) : null,
      data.pendingZelleTransfer ? JSON.stringify(data.pendingZelleTransfer) : null,
      data.pendingCryptoTransfer ? JSON.stringify(data.pendingCryptoTransfer) : null
    );
    return User.findById(id)!;
  },

  save(user: IUser): IUser {
    const db = getDb();
    db.prepare(`
      UPDATE users SET fullName=?, email=?, phone=?, ssn=?, streetAddress=?, city=?, state=?,
        zipCode=?, username=?, password=?, balance=?, savingsBalance=?, cryptoBalance=?,
        status=?, twoFactorEnabled=?, lastLogin=?, accountNumber=?, savingsNumber=?,
        cryptoNumber=?, verificationCode=?, twoFactorCode=?, twoFactorCodeExpires=?,
        isVerified=?, isApproved=?, pendingTransfer=?, pendingExternalTransfer=?,
        pendingZelleTransfer=?, pendingCryptoTransfer=?
      WHERE id=?
    `).run(
      user.fullName, user.email, user.phone, user.ssn, user.streetAddress, user.city,
      user.state, user.zipCode, user.username, user.password, user.balance,
      user.savingsBalance, user.cryptoBalance, user.status,
      user.twoFactorEnabled ? 1 : 0, user.lastLogin, user.accountNumber,
      user.savingsNumber, user.cryptoNumber, user.verificationCode,
      user.twoFactorCode, user.twoFactorCodeExpires,
      user.isVerified ? 1 : 0, user.isApproved === false ? 0 : 1,
      user.pendingTransfer ? JSON.stringify(user.pendingTransfer) : null,
      user.pendingExternalTransfer ? JSON.stringify(user.pendingExternalTransfer) : null,
      user.pendingZelleTransfer ? JSON.stringify(user.pendingZelleTransfer) : null,
      user.pendingCryptoTransfer ? JSON.stringify(user.pendingCryptoTransfer) : null,
      user.id
    );
    return User.findById(user.id)!;
  },

  findByIdAndUpdate(id: string, data: Partial<IUser>, opts?: { new?: boolean; runValidators?: boolean }): IUser | null {
    const user = User.findById(id);
    if (!user) return null;
    const merged = { ...user, ...data };
    return User.save(merged as IUser);
  },

  updateMany(query: Record<string, any>, update: Record<string, any>): void {
    const db = getDb();
    const setKeys = Object.keys(update).filter(k => k !== '$in');
    if (setKeys.length === 0) return;
    
    const setClauses = setKeys.map(k => `${k} = ?`);
    const setValues = setKeys.map(k => update[k]);
    
    // Handle $in query
    if (query._id && query._id.$in) {
      const ids = query._id.$in;
      const placeholders = ids.map(() => '?').join(',');
      let whereParts = [`id IN (${placeholders})`];
      let whereValues = [...ids];
      
      // Add other conditions
      Object.keys(query).forEach(k => {
        if (k !== '_id') {
          whereParts.push(`${k} = ?`);
          whereValues.push(query[k]);
        }
      });
      
      db.prepare(`UPDATE users SET ${setClauses.join(', ')} WHERE ${whereParts.join(' AND ')}`).run(...setValues, ...whereValues);
    }
  },

  deleteMany(query: Record<string, any>): { deletedCount: number } {
    const db = getDb();
    if (query._id && query._id.$in) {
      const ids = query._id.$in;
      const placeholders = ids.map(() => '?').join(',');
      const result = db.prepare(`DELETE FROM users WHERE id IN (${placeholders})`).run(...ids);
      return { deletedCount: result.changes };
    }
    return { deletedCount: 0 };
  },

  deleteOne(query: Record<string, any>): void {
    const db = getDb();
    if (query._id) {
      db.prepare('DELETE FROM users WHERE id = ?').run(query._id);
    }
  }
};

export default User;
