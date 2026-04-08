#!/usr/bin/env python3
"""
MongoDB to SQLite Migration Script
Connects to old MongoDB and exports all data to the SQLite database used by the Next.js app.
"""
import os
import sys
import json
import sqlite3
import uuid
from datetime import datetime

try:
    from pymongo import MongoClient
except ImportError:
    print("ERROR: pymongo not installed. Run: pip install pymongo")
    sys.exit(1)

MONGO_URI = os.environ.get("MONGODB_URI", "mongodb://zelleuser:ZelleUser_10@zelle-project-dokploymongo-vdns02:27017")
SQLITE_PATH = os.path.join(os.path.dirname(__file__), "..", "frontend", "data", "database.sqlite")

def get_mongo_db():
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
    db_name = MONGO_URI.rsplit("/", 1)[-1].split("?")[0] if "/" in MONGO_URI.rsplit("@", 1)[-1] else "test"
    if db_name in ("", "27017"):
        # If no DB name in URI, list available databases
        dbs = client.list_database_names()
        print(f"Available databases: {dbs}")
        # Try common names
        for name in ["usbanking", "zelle", "banking", "admin"]:
            if name in dbs:
                db_name = name
                break
        else:
            db_name = [d for d in dbs if d not in ("admin", "config", "local")][0] if len([d for d in dbs if d not in ("admin", "config", "local")]) > 0 else "test"
    print(f"Using MongoDB database: {db_name}")
    return client[db_name]

def init_sqlite(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    conn = sqlite3.connect(path)
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    
    conn.executescript("""
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
        CREATE INDEX IF NOT EXISTS idx_transactions_transferId ON transactions(transferId);
        CREATE INDEX IF NOT EXISTS idx_ip_logs_date ON ip_logs(date);
    """)
    return conn

def mongo_id_to_str(doc):
    """Convert MongoDB ObjectId to string"""
    if doc and "_id" in doc:
        return str(doc["_id"])
    return str(uuid.uuid4())

def to_iso(dt):
    """Convert datetime to ISO string"""
    if isinstance(dt, datetime):
        return dt.isoformat()
    if dt:
        return str(dt)
    return None

def migrate_admins(mongo_db, sqlite_conn):
    print("\n--- Migrating admins ---")
    collection = mongo_db.get_collection("admins")
    count = 0
    for doc in collection.find():
        try:
            sqlite_conn.execute(
                "INSERT OR REPLACE INTO admins (id, username, password, email, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
                (
                    mongo_id_to_str(doc),
                    doc.get("username", ""),
                    doc.get("password", ""),
                    doc.get("email", f"{doc.get('username', 'admin')}@admin.local"),
                    to_iso(doc.get("createdAt")),
                    to_iso(doc.get("updatedAt")),
                )
            )
            count += 1
        except Exception as e:
            print(f"  WARN: Skipping admin {doc.get('username')}: {e}")
    sqlite_conn.commit()
    print(f"  Migrated {count} admin(s)")

def migrate_users(mongo_db, sqlite_conn):
    print("\n--- Migrating users ---")
    collection = mongo_db.get_collection("users")
    count = 0
    user_id_map = {}
    for doc in collection.find():
        new_id = mongo_id_to_str(doc)
        old_id = str(doc.get("_id", ""))
        user_id_map[old_id] = new_id
        
        pending_transfer = doc.get("pendingTransfer")
        pending_external = doc.get("pendingExternalTransfer")
        pending_zelle = doc.get("pendingZelleTransfer")
        pending_crypto = doc.get("pendingCryptoTransfer")
        
        try:
            sqlite_conn.execute(
                """INSERT OR REPLACE INTO users (
                    id, fullName, email, phone, ssn, streetAddress, city, state, zipCode,
                    username, password, balance, savingsBalance, cryptoBalance,
                    status, twoFactorEnabled, lastLogin, accountNumber, savingsNumber, cryptoNumber,
                    verificationCode, twoFactorCode, twoFactorCodeExpires,
                    isVerified, isApproved, createdAt,
                    pendingTransfer, pendingExternalTransfer, pendingZelleTransfer, pendingCryptoTransfer
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    new_id,
                    doc.get("fullName", ""),
                    doc.get("email", ""),
                    doc.get("phone", ""),
                    doc.get("ssn", ""),
                    doc.get("streetAddress", ""),
                    doc.get("city", ""),
                    doc.get("state", ""),
                    doc.get("zipCode", ""),
                    doc.get("username", ""),
                    doc.get("password", ""),
                    float(doc.get("balance", 0)),
                    float(doc.get("savingsBalance", 0)),
                    float(doc.get("cryptoBalance", 0)),
                    doc.get("status", "active"),
                    1 if doc.get("twoFactorEnabled", True) else 0,
                    to_iso(doc.get("lastLogin")),
                    doc.get("accountNumber", ""),
                    doc.get("savingsNumber", ""),
                    doc.get("cryptoNumber", ""),
                    doc.get("verificationCode"),
                    doc.get("twoFactorCode"),
                    to_iso(doc.get("twoFactorCodeExpires")),
                    1 if doc.get("isVerified", False) else 0,
                    1 if doc.get("isApproved", True) else 0,
                    to_iso(doc.get("createdAt")),
                    json.dumps(pending_transfer) if pending_transfer else None,
                    json.dumps(pending_external) if pending_external else None,
                    json.dumps(pending_zelle) if pending_zelle else None,
                    json.dumps(pending_crypto) if pending_crypto else None,
                )
            )
            count += 1
            print(f"  User: {doc.get('username')} (balance: {doc.get('balance', 0)})")
        except Exception as e:
            print(f"  WARN: Skipping user {doc.get('username')}: {e}")
    sqlite_conn.commit()
    print(f"  Migrated {count} user(s)")
    return user_id_map

def migrate_transactions(mongo_db, sqlite_conn, user_id_map):
    print("\n--- Migrating transactions ---")
    collection = mongo_db.get_collection("transactions")
    count = 0
    for doc in collection.find():
        old_user_id = str(doc.get("userId", ""))
        new_user_id = user_id_map.get(old_user_id, old_user_id)
        
        zelle_info = doc.get("zellePersonInfo")
        
        try:
            sqlite_conn.execute(
                """INSERT OR REPLACE INTO transactions (
                    id, userId, description, amount, date, type, category, accountType,
                    status, cryptoAmount, cryptoPrice, recipientWallet, memo,
                    relatedTransactionId, transferId, zellePersonInfo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    mongo_id_to_str(doc),
                    new_user_id,
                    doc.get("description", ""),
                    float(doc.get("amount", 0)),
                    to_iso(doc.get("date")),
                    doc.get("type", ""),
                    doc.get("category", ""),
                    doc.get("accountType", "checking"),
                    doc.get("status", "completed"),
                    float(doc.get("cryptoAmount", 0)) if doc.get("cryptoAmount") else None,
                    float(doc.get("cryptoPrice", 0)) if doc.get("cryptoPrice") else None,
                    doc.get("recipientWallet"),
                    doc.get("memo"),
                    str(doc.get("relatedTransactionId", "")) if doc.get("relatedTransactionId") else None,
                    doc.get("transferId"),
                    json.dumps(zelle_info) if zelle_info else None,
                )
            )
            count += 1
        except Exception as e:
            print(f"  WARN: Skipping transaction: {e}")
    sqlite_conn.commit()
    print(f"  Migrated {count} transaction(s)")

def migrate_settings(mongo_db, sqlite_conn):
    print("\n--- Migrating settings ---")
    collection = mongo_db.get_collection("settings")
    count = 0
    for doc in collection.find():
        try:
            sqlite_conn.execute(
                """INSERT OR REPLACE INTO settings (
                    id, siteName, supportEmail, supportPhone,
                    instagramUrl, twitterUrl, facebookUrl,
                    privacyPolicy, termsOfService,
                    primaryColor, secondaryColor,
                    logoUrl, logoWidth, logoHeight,
                    twofaLogoUrl, twofaLogoWidth, twofaLogoHeight,
                    zelleLogoUrl, zelleLogoWidth, zelleLogoHeight,
                    checkingIcon, savingsIcon,
                    createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    mongo_id_to_str(doc),
                    doc.get("siteName", "US Banking"),
                    doc.get("supportEmail", "support@usbanking.icu"),
                    doc.get("supportPhone", "1-800-000-0000"),
                    doc.get("instagramUrl", ""),
                    doc.get("twitterUrl", ""),
                    doc.get("facebookUrl", ""),
                    doc.get("privacyPolicy", "Privacy policy content"),
                    doc.get("termsOfService", "Terms of service content"),
                    doc.get("primaryColor", "#5f6cd3"),
                    doc.get("secondaryColor", "#9c65d2"),
                    doc.get("logoUrl", ""),
                    float(doc.get("logoWidth", 0)),
                    float(doc.get("logoHeight", 0)),
                    doc.get("twofaLogoUrl", ""),
                    float(doc.get("twofaLogoWidth", 0)),
                    float(doc.get("twofaLogoHeight", 0)),
                    doc.get("zelleLogoUrl", ""),
                    float(doc.get("zelleLogoWidth", 0)),
                    float(doc.get("zelleLogoHeight", 0)),
                    doc.get("checkingIcon", ""),
                    doc.get("savingsIcon", ""),
                    to_iso(doc.get("createdAt")),
                    to_iso(doc.get("updatedAt")),
                )
            )
            count += 1
        except Exception as e:
            print(f"  WARN: Skipping settings: {e}")
    sqlite_conn.commit()
    print(f"  Migrated {count} settings record(s)")

def migrate_ip_logs(mongo_db, sqlite_conn):
    print("\n--- Migrating IP logs ---")
    collection = mongo_db.get_collection("iplogs")
    count = 0
    for doc in collection.find():
        try:
            sqlite_conn.execute(
                """INSERT OR REPLACE INTO ip_logs (
                    id, ip, location, date, vpnProxy, type, userId, userAgent
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    mongo_id_to_str(doc),
                    doc.get("ip", ""),
                    doc.get("location", ""),
                    to_iso(doc.get("date")),
                    1 if doc.get("vpnProxy", False) else 0,
                    doc.get("type", "visit"),
                    str(doc.get("userId", "")) if doc.get("userId") else None,
                    doc.get("userAgent", ""),
                )
            )
            count += 1
        except Exception as e:
            print(f"  WARN: Skipping IP log: {e}")
    sqlite_conn.commit()
    print(f"  Migrated {count} IP log(s)")

def migrate_pending_users(mongo_db, sqlite_conn):
    print("\n--- Migrating pending users ---")
    collection = mongo_db.get_collection("pendingusers")
    count = 0
    for doc in collection.find():
        try:
            sqlite_conn.execute(
                """INSERT OR REPLACE INTO pending_users (
                    id, fullName, email, phone, ssn, streetAddress, city, state, zipCode,
                    verificationCode, isVerified, username, password, adminVerified,
                    twoFactorCode, twoFactorEnabled, createdAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    mongo_id_to_str(doc),
                    doc.get("fullName", ""),
                    doc.get("email", ""),
                    doc.get("phone", ""),
                    doc.get("ssn", ""),
                    doc.get("streetAddress", ""),
                    doc.get("city", ""),
                    doc.get("state", ""),
                    doc.get("zipCode", ""),
                    doc.get("verificationCode"),
                    1 if doc.get("isVerified", False) else 0,
                    doc.get("username", ""),
                    doc.get("password", ""),
                    1 if doc.get("adminVerified", False) else 0,
                    doc.get("twoFactorCode"),
                    1 if doc.get("twoFactorEnabled", True) else 0,
                    to_iso(doc.get("createdAt")),
                )
            )
            count += 1
        except Exception as e:
            print(f"  WARN: Skipping pending user: {e}")
    sqlite_conn.commit()
    print(f"  Migrated {count} pending user(s)")


def main():
    print("=" * 60)
    print("MongoDB -> SQLite Migration Tool")
    print("=" * 60)
    print(f"MongoDB URI: {MONGO_URI[:30]}...")
    print(f"SQLite Path: {SQLITE_PATH}")
    
    try:
        mongo_db = get_mongo_db()
        # Test connection
        collections = mongo_db.list_collection_names()
        print(f"\nFound collections: {collections}")
    except Exception as e:
        print(f"\nERROR: Cannot connect to MongoDB: {e}")
        print("Make sure the MongoDB server is accessible and the URI is correct.")
        print("\nUsage: MONGODB_URI='mongodb://...' python3 migrate_from_mongo.py")
        sys.exit(1)
    
    sqlite_conn = init_sqlite(SQLITE_PATH)
    print("SQLite database initialized")
    
    # Run migrations
    migrate_admins(mongo_db, sqlite_conn)
    user_id_map = migrate_users(mongo_db, sqlite_conn)
    migrate_transactions(mongo_db, sqlite_conn, user_id_map)
    migrate_settings(mongo_db, sqlite_conn)
    migrate_ip_logs(mongo_db, sqlite_conn)
    migrate_pending_users(mongo_db, sqlite_conn)
    
    sqlite_conn.close()
    
    print("\n" + "=" * 60)
    print("Migration complete!")
    print(f"SQLite database saved to: {SQLITE_PATH}")
    print("=" * 60)


if __name__ == "__main__":
    main()
