# US Banking App - PRD

## Original Problem Statement
User provided a Next.js full-stack banking application codebase that originally used MongoDB. Core requests:
1. Migrate database from MongoDB to internal SQLite DB
2. Containerize via Dockerfile for Dokploy deployment
3. Overhaul and modernize UI (Chime-inspired fintech style)
4. Fix realism details (purely numeric account numbers)
5. Verify core functionality and data integrity

## Architecture
- **Frontend**: Next.js 15.2.4 (React) with Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes (all /api/* routes), FastAPI proxy on port 8001
- **Database**: SQLite via better-sqlite3 at /app/frontend/data/database.sqlite
- **Styling**: Manrope + JetBrains Mono fonts, Chime-inspired fintech design
- **Dynamic Colors**: Admin-configurable via CSS variables (--primary-50 to --primary-900)

## What's Been Implemented

### Phase 1 - Database Migration (DONE)
- MongoDB/Mongoose completely removed
- better-sqlite3 integrated for local SQLite storage
- 7 data models rewritten as SQLite class wrappers
- ~40 Next.js API routes migrated
- FastAPI proxy bridging platform ingress to Next.js
- Admin seed script working

### Phase 2 - UI Modernization (DONE - Feb 2026)
- Landing page: Clean Chime-inspired hero, features, FAQ, CTA sections
- Login page: Minimal, modern fintech login with 2FA support
- Register page: Multi-step form with step indicators
- Dashboard: Modern card-based layout with checking/savings/crypto overview
- Accounts page: Ultra-realistic bank account view with masked/revealed numbers, routing numbers, quick actions, transaction feeds
- TopBar: Slim, frosted-glass navbar with logo and logout
- Typography: Manrope for UI, JetBrains Mono for numbers
- Gradient text headers replaced with clean solid slate-900 across all pages

### Phase 3 - Realism Fixes (DONE - Feb 2026)
- Account numbers: Changed from "****XXXX" to purely numeric 12-digit strings
- Both admin-create-user and approve-user routes updated
- Verified via testing agent: accounts show numbers like "318077083968"

### Phase 4 - Dockerfile/Dokploy (DONE)
- Dockerfile configured for better-sqlite3 native module compilation
- VOLUME mount for /app/data (SQLite persistence)
- libc6-compat added for Alpine runtime compatibility
- Port 3000 exposed

### Phase 5 - MongoDB Removal & Dockerfile Fix (DONE - Feb 2026)
- Removed `mongodb` and `mongoose` from `package.json`
- Deleted `lib/mongodb.ts` remnant file
- Fixed `email.ts` module-level assertions → lazy initialization (prevents build-time crash)
- Converted ALL email imports to **dynamic imports** (`await import("@/lib/email")`) inside handler functions — email module is NEVER loaded at build time
- Fixed `accounts/route.ts` module-level `throw` for missing JWT_SECRET → uses fallback
- Added `export const dynamic = "force-dynamic"` to ALL 54 API routes
- Created `.dockerignore` (excludes node_modules, .next, .git)
- Updated Dockerfile: creates fallback `.env` with placeholders if none exists during build
- Added `libc6-compat` for Alpine runtime compatibility
- Created `scripts/migrate_from_mongo.py` for MongoDB → SQLite data transfer
- **VERIFIED: Build succeeds with ZERO environment variables** — no module-level code can crash the build

## P0-P3 Status
- **P0 (Functionality + Deployment)**: ALL WORKING - MongoDB fully removed, Dockerfile builds without errors
- **P1 (UI Overhaul)**: COMPLETE - Chime-inspired fintech style across all major pages
- **P2 (Numeric Account Numbers)**: VERIFIED - 12-digit numeric strings
- **P3 (SQLite Integrity)**: VERIFIED - Database working, all CRUD operations functional

## Remaining/Future Tasks
- Polish remaining dashboard sub-pages (transfers, transactions, crypto, profile) to fully match new design system
- Consider adding loading skeletons for better perceived performance
- Admin panel could benefit from visual polish
- Automated SQLite backups for data volume
