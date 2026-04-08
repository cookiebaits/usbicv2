# US Banking App - PRD

## Original Problem Statement
Migrate usbanking.icu Next.js banking app from MongoDB to SQLite. Make it work on Dokploy with simple changes. Incorporate previous environment variables. Focus on functionality first.

## Architecture
- **Framework**: Next.js 15 (App Router) - full-stack with API routes
- **Database**: SQLite via `better-sqlite3` (migrated from MongoDB/Mongoose)
- **Auth**: JWT-based (admin cookies, user Bearer tokens)
- **Email**: Nodemailer with Hostinger SMTP (verify@usbanking.icu)
- **Crypto Price**: CoinGecko API

## Core Requirements
- User registration with email verification and admin approval
- User login with optional 2FA via email codes
- Banking dashboard with checking, savings, and crypto accounts
- Internal transfers (checking ↔ savings)
- External transfers (wire)
- Zelle transfers
- Crypto (Bitcoin) buy/sell/transfer
- Admin dashboard for user management, transaction management, settings, IP logs

## What's Been Implemented (Jan 2026)
- [x] Full MongoDB → SQLite migration (7 models, 40+ API routes)
- [x] SQLite database layer (`lib/database.ts`) with schema initialization
- [x] Model wrappers: User, Admin, Transaction, Settings, IPLog, PendingUser, RecoveryCode
- [x] All API routes rewritten: login, register, accounts, transfers, admin CRUD, settings, IP logs
- [x] Admin seed script (`scripts/seed.js`) creates default admin user
- [x] Dockerfile updated for SQLite support (build tools, data volume)
- [x] Environment variables incorporated from original deployment
- [x] Backend proxy (FastAPI) on port 8001 for Kubernetes routing
- [x] All 17 tests passed (100% backend, 100% frontend)

## Database Schema (SQLite)
Tables: users, admins, transactions, settings, ip_logs, pending_users, recovery_codes

## Deployment (Dokploy)
- Dockerfile at `/app/frontend/Dockerfile`
- SQLite data persists in `/app/data/` volume
- Run `node scripts/seed.js` on first deploy to create admin user
- Environment variables in `.env` file

## Backlog
- P0: Done - all functionality preserved
- P1: Done - SQLite migration complete
- P2: Done - env variables incorporated
- Future: Data migration tool from old MongoDB to new SQLite
- Future: Automated backups for SQLite data volume
