// Seed script to create initial admin user
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    ssn TEXT NOT NULL,
    streetAddress TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL DEFAULT '',
    zipCode TEXT NOT NULL DEFAULT '',
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    balance REAL DEFAULT 0,
    savingsBalance REAL DEFAULT 0,
    cryptoBalance REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    twoFactorEnabled INTEGER DEFAULT 1,
    lastLogin TEXT,
    accountNumber TEXT,
    savingsNumber TEXT,
    cryptoNumber TEXT,
    verificationCode TEXT,
    twoFactorCode TEXT,
    twoFactorCodeExpires TEXT,
    isVerified INTEGER DEFAULT 0,
    isApproved INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    pendingTransfer TEXT,
    pendingExternalTransfer TEXT,
    pendingZelleTransfer TEXT,
    pendingCryptoTransfer TEXT
  );

  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT DEFAULT (datetime('now')),
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    accountType TEXT NOT NULL,
    status TEXT DEFAULT 'completed',
    cryptoAmount REAL,
    cryptoPrice REAL,
    recipientWallet TEXT,
    memo TEXT,
    relatedTransactionId TEXT,
    transferId TEXT,
    zellePersonInfo TEXT,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    siteName TEXT NOT NULL,
    supportEmail TEXT NOT NULL,
    supportPhone TEXT NOT NULL,
    instagramUrl TEXT DEFAULT '',
    twitterUrl TEXT DEFAULT '',
    facebookUrl TEXT DEFAULT '',
    privacyPolicy TEXT NOT NULL,
    termsOfService TEXT NOT NULL,
    primaryColor TEXT DEFAULT '#5f6cd3',
    secondaryColor TEXT DEFAULT '#9c65d2',
    logoUrl TEXT DEFAULT '',
    logoWidth REAL DEFAULT 0,
    logoHeight REAL DEFAULT 0,
    twofaLogoUrl TEXT DEFAULT '',
    twofaLogoWidth REAL DEFAULT 0,
    twofaLogoHeight REAL DEFAULT 0,
    zelleLogoUrl TEXT DEFAULT '',
    zelleLogoWidth REAL DEFAULT 0,
    zelleLogoHeight REAL DEFAULT 0,
    checkingIcon TEXT DEFAULT '',
    savingsIcon TEXT DEFAULT '',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ip_logs (
    id TEXT PRIMARY KEY,
    ip TEXT NOT NULL,
    location TEXT NOT NULL,
    date TEXT DEFAULT (datetime('now')),
    vpnProxy INTEGER DEFAULT 0,
    type TEXT NOT NULL,
    userId TEXT,
    userAgent TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS pending_users (
    id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    ssn TEXT NOT NULL,
    streetAddress TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL DEFAULT '',
    zipCode TEXT NOT NULL DEFAULT '',
    verificationCode TEXT,
    isVerified INTEGER DEFAULT 0,
    username TEXT DEFAULT '',
    password TEXT DEFAULT '',
    adminVerified INTEGER DEFAULT 0,
    twoFactorCode TEXT,
    twoFactorEnabled INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS recovery_codes (
    id TEXT PRIMARY KEY,
    adminId TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    expiresAt TEXT NOT NULL,
    FOREIGN KEY (adminId) REFERENCES admins(id)
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_userId ON transactions(userId);
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_ip_logs_date ON ip_logs(date);
`);

// Check if admin exists
const existingAdmin = db.prepare('SELECT * FROM admins LIMIT 1').get();

if (!existingAdmin) {
  const id = crypto.randomUUID();
  const salt = bcrypt.genSaltSync(12);
  const hashedPassword = bcrypt.hashSync('admin123', salt);

  db.prepare('INSERT INTO admins (id, username, password, email) VALUES (?, ?, ?, ?)')
    .run(id, 'admin', hashedPassword, 'admin@usbanking.icu');

  console.log('Admin user created:');
  console.log('  Username: admin');
  console.log('  Password: admin123');
} else {
  console.log('Admin already exists:', existingAdmin.username);
}

// Check if settings exist, create default if not
const existingSettings = db.prepare('SELECT * FROM settings LIMIT 1').get();
if (!existingSettings) {
  const settingsId = crypto.randomUUID();
  db.prepare(`INSERT INTO settings (id, siteName, supportEmail, supportPhone, privacyPolicy, termsOfService) 
    VALUES (?, ?, ?, ?, ?, ?)`).run(
    settingsId, 'US Banking', 'support@usbanking.icu', '1-800-555-0199',
    'Privacy policy content goes here.', 'Terms of service content goes here.'
  );
  console.log('Default settings created');
}

db.close();
console.log('Seed complete!');
