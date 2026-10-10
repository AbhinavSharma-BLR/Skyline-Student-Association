# Database Subsystem Guide (Evaluator Orientation)

Welcome Evaluator! This directory houses all database configuration, schema definitions, migration history, seeding logic, and maintenance utilities for the **Skyline Student Association ERP**.

---

## 1. Directory Structure & Layout

```
database/
├── README.md                           # This orientation guide
├── prisma/
│   ├── schema.prisma                  # Single declarative source of truth for database models
│   ├── seed.ts                        # Idempotent demo account & fixture data seeder
│   └── migrations/
│       ├── migration_lock.toml        # Prisma migration engine lockfile
│       └── 20261010165427_init_skyline_schema/
│           └── migration.sql          # Applied SQL migration (DDL + check constraints + indexes)
└── scripts/
    └── check-connection.ts            # Read-only connectivity & record inspection utility
```

### What Each Directory & File Does:

- **`database/prisma/schema.prisma`**: The single declarative schema defining all 27 database models (Better Auth user and session tables + all Skyline club domain tables like activities, bookings, orders, claims, cashbook entries, and club settings).
- **`database/prisma/migrations/`**: The complete, immutable chronological migration history managed by Prisma Migrate. Contains exact SQL statements previously executed on the PostgreSQL instance.
- **`database/prisma/seed.ts`**: The idempotent database seeding script. Populates initial demo accounts (Student, Officer, Treasurer) and domain fixtures (Academic period, Hackathon event, club hoodie merchandise).
- **`database/scripts/check-connection.ts`**: A safe, read-only diagnostic utility that checks connection health, queries server metadata, and counts core table records without exposing credentials or mutating state.

---

## 2. Core Concepts: Schema vs. Migrations vs. Seed Data

1. **Prisma Schema (`schema.prisma`)**:
   - The *design blueprint* for the database.
   - Defines models, column data types, foreign keys, and indexes in Prisma's declarative language.
   - Used by the Prisma CLI to generate the TypeScript Prisma Client.

2. **Prisma Migrations (`migrations/` directory)**:
   - The *historical evolutionary record* of the physical database schema.
   - Contains pure PostgreSQL DDL (`CREATE TABLE`, `ALTER TABLE`, check constraints, partial indexes).
   - Guarantees that every environment (local laptop, CI, production) runs the identical SQL migrations in the exact same order.

3. **Seed Data (`seed.ts`)**:
   - The *initial content* injected into the database tables once the schema exists.
   - Populates initial demo users and baseline operational records.
   - **Strictly Idempotent**: It checks `prisma.user.findUnique` first; running it repeatedly will never duplicate rows, overwrite existing data, or reset passwords.

---

## 3. How Prisma Connects the Backend to PostgreSQL

```
┌─────────────────────────────────┐
│     Next.js / TypeScript App    │
│ (app/api routes & Backend/lib/) │
└────────────────┬────────────────┘
                 │
                 │ 1. Imports singleton `prisma`
                 ▼
┌─────────────────────────────────┐
│  Runtime Prisma Client Package  │
│    (node_modules/@prisma/client)│
└────────────────┬────────────────┘
                 │
                 │ 2. Reads `DATABASE_URL` from `.env`
                 │ 3. Uses native Query Engine binary
                 ▼
┌─────────────────────────────────┐
│       Local PostgreSQL 16       │
│  (Host: localhost, Port: 5432)  │
│   Database: `skyline_dev`       │
└─────────────────────────────────┘
```

1. **Singleton Client**: Located at `Backend/lib/prisma.ts`. It lazily instantiates the `PrismaClient` with connection pooling.
2. **Connection Parameters**: Loaded securely from the local `.env` file via `DATABASE_URL`.
3. **Runtime Engine**: Prisma uses an optimized query engine library that translates Prisma Client queries into performant PostgreSQL queries executed over TCP port `5432`.

---

## 4. Connection Details (Excluding Passwords)

- **Database Engine**: PostgreSQL 16.8 (x64)
- **Database Server Host**: `localhost` (`127.0.0.1` / `::1`)
- **Port**: `5432`
- **Database Name**: `skyline_dev`
- **Schema**: `public`
- **Maximum Connections**: Configured with `max_connections=300` to support concurrent reservation stress testing.

*(Note: Sensitive connection credentials and secret keys are stored exclusively in the gitignored `.env` / `.env.local` file).*

---

## 5. Verified Database Commands

All commands are configured in `package.json` with the updated `database/prisma/` path:

### Validate Schema
Checks schema syntax, relations, and attribute correctness:
```bash
npm run db:validate
# Or: npx prisma validate
```

### Generate Prisma Client
Generates the type-safe runtime client into `node_modules/@prisma/client`:
```bash
npm run db:generate
# Or: npx prisma generate
```

### Check Migration Status
Verifies that all migrations in `database/prisma/migrations/` match the database schema:
```bash
npm run db:status
# Or: npx prisma migrate status
```

### Apply Migrations
Applies pending migrations in a production or demo environment:
```bash
npm run db:migrate
# Or: npx prisma migrate deploy
```

### Seed Demo Data
Populates demo users and starter domain entities idempotently:
```bash
npm run db:seed
# Or: npx tsx database/prisma/seed.ts
```

### Read-Only Connection Health Check
Queries server version, host, port, and record counts safely:
```bash
npm run db:check
# Or: npx tsx database/scripts/check-connection.ts
```

---

## 6. Where the Runtime Prisma Client Lives

- **Location**: `node_modules/@prisma/client` and `node_modules/.prisma/client/`
- When you run `npm run db:generate`, Prisma reads `database/prisma/schema.prisma` and generates:
  - TypeScript types corresponding to every model.
  - The runtime JavaScript query builder.
  - The native query engine binary for the operating system (`query_engine-windows.dll.node` on Windows).
- Application code accesses this simply by importing:
  ```typescript
  import { PrismaClient } from "@prisma/client";
  ```
  Or using our application singleton:
  ```typescript
  import { prisma } from "@/lib/prisma";
  ```

---

## 7. Why Database Storage & Secrets Are Not in Git

1. **Storage Binaries & Raw Data (`D:\pgsql\data`)**:
   - PostgreSQL stores table records as binary storage blocks, transaction logs (WAL), and memory maps.
   - These are machine-specific, platform-dependent (Windows vs Linux), and unsuitable for source control.
   - Committing raw data creates repository bloat and potential corruption.

2. **Secrets & Credentials (`.env`, `.env.local`)**:
   - Passwords, signing keys (`BETTER_AUTH_SECRET`), encryption keys (`RECEIPT_TOKEN_ENCRYPTION_KEY`), and database connection URIs must never be committed to Git.
   - Version control tracks the template (`.env.example`) so developers know which environment variables are required, while local configuration remains strictly gitignored (`.gitignore`).
