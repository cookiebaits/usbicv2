import { getDb, generateId } from '@/lib/database';

export interface ISettings {
  id: string;
  _id: string;
  siteName: string;
  supportEmail: string;
  supportPhone: string;
  instagramUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  privacyPolicy: string;
  termsOfService: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  logoWidth?: number;
  logoHeight?: number;
  twofaLogoUrl?: string;
  twofaLogoWidth?: number;
  twofaLogoHeight?: number;
  zelleLogoUrl?: string;
  zelleLogoWidth?: number;
  zelleLogoHeight?: number;
  checkingIcon?: string;
  savingsIcon?: string;
  createdAt: string;
  updatedAt: string;
}

function rowToSettings(row: any): ISettings | null {
  if (!row) return null;
  return { ...row, _id: row.id };
}

const Settings = {
  findOne(query?: Record<string, any>): ISettings | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM settings LIMIT 1').get();
    return rowToSettings(row);
  },

  findOneAndUpdate(query: Record<string, any>, data: Partial<ISettings>, opts?: { upsert?: boolean; new?: boolean }): ISettings {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM settings LIMIT 1').get() as any;
    const now = new Date().toISOString();
    
    if (existing) {
      db.prepare(`
        UPDATE settings SET siteName=?, supportEmail=?, supportPhone=?, instagramUrl=?,
          twitterUrl=?, facebookUrl=?, privacyPolicy=?, termsOfService=?, primaryColor=?,
          secondaryColor=?, logoUrl=?, logoWidth=?, logoHeight=?, twofaLogoUrl=?,
          twofaLogoWidth=?, twofaLogoHeight=?, zelleLogoUrl=?, zelleLogoWidth=?,
          zelleLogoHeight=?, checkingIcon=?, savingsIcon=?, updatedAt=?
        WHERE id=?
      `).run(
        data.siteName ?? existing.siteName,
        data.supportEmail ?? existing.supportEmail,
        data.supportPhone ?? existing.supportPhone,
        data.instagramUrl ?? existing.instagramUrl ?? '',
        data.twitterUrl ?? existing.twitterUrl ?? '',
        data.facebookUrl ?? existing.facebookUrl ?? '',
        data.privacyPolicy ?? existing.privacyPolicy,
        data.termsOfService ?? existing.termsOfService,
        data.primaryColor ?? existing.primaryColor ?? '#5f6cd3',
        data.secondaryColor ?? existing.secondaryColor ?? '#9c65d2',
        data.logoUrl ?? existing.logoUrl ?? '',
        data.logoWidth ?? existing.logoWidth ?? 0,
        data.logoHeight ?? existing.logoHeight ?? 0,
        data.twofaLogoUrl ?? existing.twofaLogoUrl ?? '',
        data.twofaLogoWidth ?? existing.twofaLogoWidth ?? 0,
        data.twofaLogoHeight ?? existing.twofaLogoHeight ?? 0,
        data.zelleLogoUrl ?? existing.zelleLogoUrl ?? '',
        data.zelleLogoWidth ?? existing.zelleLogoWidth ?? 0,
        data.zelleLogoHeight ?? existing.zelleLogoHeight ?? 0,
        data.checkingIcon ?? existing.checkingIcon ?? '',
        data.savingsIcon ?? existing.savingsIcon ?? '',
        now,
        existing.id
      );
      return Settings.findOne()!;
    } else if (opts?.upsert) {
      const id = generateId();
      db.prepare(`
        INSERT INTO settings (id, siteName, supportEmail, supportPhone, instagramUrl,
          twitterUrl, facebookUrl, privacyPolicy, termsOfService, primaryColor,
          secondaryColor, logoUrl, logoWidth, logoHeight, twofaLogoUrl, twofaLogoWidth,
          twofaLogoHeight, zelleLogoUrl, zelleLogoWidth, zelleLogoHeight, checkingIcon,
          savingsIcon, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.siteName || 'US Banking',
        data.supportEmail || '',
        data.supportPhone || '',
        data.instagramUrl || '',
        data.twitterUrl || '',
        data.facebookUrl || '',
        data.privacyPolicy || '',
        data.termsOfService || '',
        data.primaryColor || '#5f6cd3',
        data.secondaryColor || '#9c65d2',
        data.logoUrl || '',
        data.logoWidth || 0,
        data.logoHeight || 0,
        data.twofaLogoUrl || '',
        data.twofaLogoWidth || 0,
        data.twofaLogoHeight || 0,
        data.zelleLogoUrl || '',
        data.zelleLogoWidth || 0,
        data.zelleLogoHeight || 0,
        data.checkingIcon || '',
        data.savingsIcon || '',
        now, now
      );
      return Settings.findOne()!;
    }
    return null as any;
  }
};

export default Settings;
