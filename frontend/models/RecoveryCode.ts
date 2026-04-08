import { getDb, generateId } from '@/lib/database';

export interface IRecoveryCode {
  id: string;
  _id: string;
  adminId: string;
  code: string;
  expiresAt: string;
}

function rowToRecoveryCode(row: any): IRecoveryCode | null {
  if (!row) return null;
  return { ...row, _id: row.id };
}

const RecoveryCode = {
  findOne(query: Record<string, any>): IRecoveryCode | null {
    const db = getDb();
    const keys = Object.keys(query);
    if (keys.length === 0) return null;
    const where = keys.map(k => `${k} = ?`).join(' AND ');
    const values = keys.map(k => query[k]);
    const row = db.prepare(`SELECT * FROM recovery_codes WHERE ${where} LIMIT 1`).get(...values);
    return rowToRecoveryCode(row);
  },

  create(data: Partial<IRecoveryCode>): IRecoveryCode {
    const db = getDb();
    const id = generateId();
    db.prepare(`INSERT INTO recovery_codes (id, adminId, code, expiresAt) VALUES (?, ?, ?, ?)`)
      .run(id, data.adminId, data.code, data.expiresAt);
    return RecoveryCode.findOne({ id })!;
  },

  deleteMany(query: Record<string, any>): void {
    const db = getDb();
    if (query.adminId) {
      db.prepare('DELETE FROM recovery_codes WHERE adminId = ?').run(query.adminId);
    }
  },

  deleteOne(query: Record<string, any>): void {
    const db = getDb();
    if (query._id) {
      db.prepare('DELETE FROM recovery_codes WHERE id = ?').run(query._id);
    }
  }
};

export default RecoveryCode;
