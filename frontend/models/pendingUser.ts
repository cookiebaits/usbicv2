import { getDb, generateId } from '@/lib/database';

export interface IPendingUser {
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
  verificationCode: string | null;
  isVerified: boolean;
  username: string;
  password: string;
  adminVerified: boolean;
  twoFactorCode?: string;
  twoFactorEnabled?: boolean;
  createdAt: string;
}

function rowToPendingUser(row: any): IPendingUser | null {
  if (!row) return null;
  return {
    ...row,
    _id: row.id,
    isVerified: !!row.isVerified,
    adminVerified: !!row.adminVerified,
    twoFactorEnabled: !!row.twoFactorEnabled,
  };
}

const PendingUser = {
  findOne(query: Record<string, any>): IPendingUser | null {
    const db = getDb();
    
    // Handle complex queries with $or, $ne, $exists
    if (query.$or || query.username?.$ne !== undefined || query.password?.$ne !== undefined) {
      // Complex query for pending users listing
      let conditions: string[] = [];
      let values: any[] = [];
      
      if (query.isVerified !== undefined) {
        conditions.push('isVerified = ?');
        values.push(query.isVerified ? 1 : 0);
      }
      if (query.username && query.username.$ne !== undefined) {
        conditions.push('username != ?');
        values.push(query.username.$ne);
      }
      if (query.password && query.password.$ne !== undefined) {
        conditions.push('password != ?');
        values.push(query.password.$ne);
      }
      if (query.$or) {
        const orParts: string[] = [];
        for (const sub of query.$or) {
          for (const [k, v] of Object.entries(sub)) {
            if (typeof v === 'object' && v !== null && (v as any).$exists !== undefined) {
              // Skip $exists
            } else {
              orParts.push(`${k} = ?`);
              values.push(v);
            }
          }
        }
        if (orParts.length > 0) conditions.push(`(${orParts.join(' OR ')})`);
      }
      
      const sql = conditions.length > 0 
        ? `SELECT * FROM pending_users WHERE ${conditions.join(' AND ')} LIMIT 1`
        : 'SELECT * FROM pending_users LIMIT 1';
      const row = conditions.length > 0 ? db.prepare(sql).get(...values) : db.prepare(sql).get();
      return rowToPendingUser(row);
    }
    
    const keys = Object.keys(query);
    if (keys.length === 0) return null;
    const where = keys.map(k => `${k} = ?`).join(' AND ');
    const vals = keys.map(k => query[k]);
    const row = db.prepare(`SELECT * FROM pending_users WHERE ${where} LIMIT 1`).get(...vals);
    return rowToPendingUser(row);
  },

  findById(id: string): IPendingUser | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM pending_users WHERE id = ?').get(id);
    return rowToPendingUser(row);
  },

  find(query?: Record<string, any>): IPendingUser[] {
    const db = getDb();
    
    if (!query || Object.keys(query).length === 0) {
      return db.prepare('SELECT * FROM pending_users').all().map(rowToPendingUser).filter(Boolean) as IPendingUser[];
    }
    
    let conditions: string[] = [];
    let values: any[] = [];
    
    if (query.isVerified !== undefined) {
      conditions.push('isVerified = ?');
      values.push(query.isVerified ? 1 : 0);
    }
    if (query.adminVerified !== undefined) {
      conditions.push('adminVerified = ?');
      values.push(query.adminVerified ? 1 : 0);
    }
    if (query.username && query.username.$ne !== undefined) {
      conditions.push('username != ?');
      values.push(query.username.$ne);
    }
    if (query.password && query.password.$ne !== undefined) {
      conditions.push('password != ?');
      values.push(query.password.$ne);
    }
    
    // Handle $or for adminVerified
    if (query.$or) {
      const orParts: string[] = [];
      for (const sub of query.$or) {
        for (const [k, v] of Object.entries(sub)) {
          if (typeof v === 'object' && v !== null && (v as any).$exists !== undefined) {
            // For $exists: false, skip
          } else {
            orParts.push(`${k} = ?`);
            values.push(typeof v === 'boolean' ? (v ? 1 : 0) : v);
          }
        }
      }
      if (orParts.length > 0) conditions.push(`(${orParts.join(' OR ')})`);
    }
    
    const sql = conditions.length > 0
      ? `SELECT * FROM pending_users WHERE ${conditions.join(' AND ')}`
      : 'SELECT * FROM pending_users';
    return (conditions.length > 0 ? db.prepare(sql).all(...values) : db.prepare(sql).all()).map(rowToPendingUser).filter(Boolean) as IPendingUser[];
  },

  create(data: Partial<IPendingUser>): IPendingUser {
    const db = getDb();
    const id = generateId();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO pending_users (id, fullName, email, phone, ssn, streetAddress, city, state,
        zipCode, verificationCode, isVerified, username, password, adminVerified, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.fullName || '',
      data.email || '',
      data.phone || '',
      data.ssn || '',
      data.streetAddress || '',
      data.city || '',
      data.state || '',
      data.zipCode || '',
      data.verificationCode || null,
      data.isVerified ? 1 : 0,
      data.username || '',
      data.password || '',
      data.adminVerified ? 1 : 0,
      now
    );
    return PendingUser.findById(id)!;
  },

  save(user: IPendingUser): IPendingUser {
    const db = getDb();
    db.prepare(`
      UPDATE pending_users SET fullName=?, email=?, phone=?, ssn=?, streetAddress=?, city=?,
        state=?, zipCode=?, verificationCode=?, isVerified=?, username=?, password=?,
        adminVerified=?, twoFactorCode=?, twoFactorEnabled=?
      WHERE id=?
    `).run(
      user.fullName, user.email, user.phone, user.ssn, user.streetAddress, user.city,
      user.state, user.zipCode, user.verificationCode, user.isVerified ? 1 : 0,
      user.username, user.password, user.adminVerified ? 1 : 0,
      user.twoFactorCode || null, user.twoFactorEnabled ? 1 : 0, user.id
    );
    return PendingUser.findById(user.id)!;
  },

  deleteOne(query: Record<string, any>): void {
    const db = getDb();
    if (query._id) {
      db.prepare('DELETE FROM pending_users WHERE id = ?').run(query._id);
    }
  }
};

export default PendingUser;
