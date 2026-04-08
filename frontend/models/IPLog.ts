import { getDb, generateId } from '@/lib/database';

export interface IIPLog {
  id: string;
  _id: string;
  ip: string;
  location: string;
  date: string;
  vpnProxy: boolean;
  type: string;
  userId: string | null;
  userAgent: string;
}

function rowToIPLog(row: any): IIPLog | null {
  if (!row) return null;
  return { ...row, _id: row.id, vpnProxy: !!row.vpnProxy };
}

const IPLog = {
  find(query?: Record<string, any>): IIPLog[] {
    const db = getDb();
    return db.prepare('SELECT * FROM ip_logs ORDER BY date DESC').all().map(rowToIPLog).filter(Boolean) as IIPLog[];
  },

  create(data: Partial<IIPLog>): IIPLog {
    const db = getDb();
    const id = generateId();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO ip_logs (id, ip, location, date, vpnProxy, type, userId, userAgent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.ip || '',
      data.location || '',
      data.date || now,
      data.vpnProxy ? 1 : 0,
      data.type || 'visit',
      data.userId || null,
      data.userAgent || ''
    );
    return IPLog.findById(id)!;
  },

  findById(id: string): IIPLog | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM ip_logs WHERE id = ?').get(id);
    return rowToIPLog(row);
  },

  findByIdAndDelete(id: string): void {
    const db = getDb();
    db.prepare('DELETE FROM ip_logs WHERE id = ?').run(id);
  },

  deleteMany(query?: Record<string, any>): void {
    const db = getDb();
    db.prepare('DELETE FROM ip_logs').run();
  }
};

export default IPLog;
