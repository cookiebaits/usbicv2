import { getDb, generateId } from '@/lib/database';
import bcrypt from 'bcryptjs';

export interface IAdmin {
  id: string;
  _id: string;
  username: string;
  password: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

function rowToAdmin(row: any): IAdmin | null {
  if (!row) return null;
  return { ...row, _id: row.id };
}

const Admin = {
  findOne(query: Record<string, any>): IAdmin | null {
    const db = getDb();
    const keys = Object.keys(query);
    if (keys.length === 0) return null;
    
    // Handle $ne and complex queries
    const conditions: string[] = [];
    const values: any[] = [];
    for (const k of keys) {
      if (typeof query[k] === 'object' && query[k].$ne !== undefined) {
        conditions.push(`${k} != ?`);
        values.push(query[k].$ne);
      } else {
        conditions.push(`${k} = ?`);
        values.push(query[k]);
      }
    }
    
    const row = db.prepare(`SELECT * FROM admins WHERE ${conditions.join(' AND ')} LIMIT 1`).get(...values);
    return rowToAdmin(row);
  },

  findById(id: string): IAdmin | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
    return rowToAdmin(row);
  },

  create(data: Partial<IAdmin>): IAdmin {
    const db = getDb();
    const id = data.id || generateId();
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO admins (id, username, password, email, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, data.username, data.password, data.email, now, now);
    return Admin.findById(id)!;
  },

  async comparePassword(admin: IAdmin, candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, admin.password);
  },

  save(admin: IAdmin): IAdmin {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`UPDATE admins SET username=?, password=?, email=?, updatedAt=? WHERE id=?`)
      .run(admin.username, admin.password, admin.email, now, admin.id);
    return Admin.findById(admin.id)!;
  },

  updateOne(query: Record<string, any>, update: Record<string, any>): { matchedCount: number } {
    const db = getDb();
    let id: string;
    if (query._id) {
      id = query._id;
    } else {
      const admin = Admin.findOne(query);
      if (!admin) return { matchedCount: 0 };
      id = admin.id;
    }
    
    const setData = update.$set || update;
    const keys = Object.keys(setData);
    if (keys.length === 0) return { matchedCount: 0 };
    
    const setClauses = keys.map(k => `${k} = ?`);
    const values = keys.map(k => setData[k]);
    
    const result = db.prepare(`UPDATE admins SET ${setClauses.join(', ')}, updatedAt = ? WHERE id = ?`).run(...values, new Date().toISOString(), id);
    return { matchedCount: result.changes };
  }
};

export default Admin;
