# Database Developer Progress Log

**Developer:** DB Developer
**Last updated:** 2026-10-10 (session start)
**Current phase:** Phase 1
**Current task:** P1-DB-01 — PostgreSQL Setup and Initial Schema

---

## Progress Entries

### [2026-10-10] P1-DB-01 — PostgreSQL Setup & Unified Prisma Schema
Status: **DONE**
Evidence:
- Local PostgreSQL 16.8 (x64) installed and running on port 5432 (`max_connections=300`).
- Database `skyline_dev` initialized.
- Unified `prisma/schema.prisma` authored with all 27 models covering Better Auth (`User`, `Session`, `Account`, `Verification`) and domain models (`Role`, `MembershipPeriod`, `Membership`, `Purchase`, `PaymentAttempt`, `Activity`, `ActivityStaff`, `Booking`, `Ticket`, `Product`, `Variant`, `Order`, `OrderItem`, `Claim`, `ReceiptFile`, `FundraiserReceipt`, `CashbookEntry`, `ClubSettings`, `HandoverSnapshot`, `Task`, `Announcement`, `EmailJob`).
- Prisma Client v6.19.3 generated.

### [2026-10-10] P2-DB-01 — Committed Migration & Domain Constraints
Status: **DONE**
Evidence:
- Migration `prisma/migrations/20261010165427_init_skyline_schema/migration.sql` created and applied via `prisma migrate deploy`.
- Applied domain check constraints:
  - `chk_cashbook_one_source` (exactly one non-null source reference per cashbook entry)
  - `chk_claim_status` (`submitted`, `under_review`, `approved`, `rejected`, `paid`)
  - `chk_order_status` (`reserved`, `confirmed`, `expired`, `cancelled`)
  - `chk_order_fulfilment` (`pending`, `ready`, `collected`)
  - `chk_role_value` (`officer`, `treasurer`)
  - `chk_variant_stock_capacity` (`stockReserved + stockSold <= stockTotal`)
  - `chk_task_status` (`open`, `in_progress`, `done`, `cancelled`)
- Applied partial unique indexes:
  - `idx_cashbook_unique_payment_attempt` on `cashbook_entries("paymentAttemptId") WHERE "paymentAttemptId" IS NOT NULL`
  - `idx_cashbook_unique_claim` on `cashbook_entries("claimId") WHERE "claimId" IS NOT NULL`
  - `idx_cashbook_unique_fundraiser_receipt` on `cashbook_entries("fundraiserReceiptId") WHERE "fundraiserReceiptId" IS NOT NULL`
  - `idx_payment_unique_provider_ref` on `payment_attempts(provider, "providerRef") WHERE "providerRef" IS NOT NULL`

### [2026-10-10] P3-DB-01 — Idempotent Seeding & Verification
Status: **DONE**
Evidence:
- `prisma/seed.ts` executed via `npm run db:seed`.
- Hashed authentication credentials seeded for:
  - `student@skyline.edu` (Student)
  - `officer@skyline.edu` (Officer role)
  - `treasurer@skyline.edu` (Treasurer role)
- Academic period `2026-2027` (₹500 / 50000 paise), Hackathon activity (100 capacity) + staff, Club hoodie + variants, volunteer task, announcement seeded.
- Verified with 27 live database integration tests (`Backend/tests/integration/real-db-workflows.test.ts`), all passing.
- Test-data isolation strategy updated to exact primary key tracking (`TestResourceTracker`); zero broad prefix sweeps, zero table truncations, and preserved demo accounts.

### [2026-10-10] P4-DB-01 — Database Subsystem Reorganization into database/
Status: **DONE**
Evidence:
- Reorganized all database files into dedicated root `database/` folder:
  - `database/prisma/schema.prisma` (single source of truth for 27 models)
  - `database/prisma/migrations/` (exact migration history, lockfile, and SQL constraints)
  - `database/prisma/seed.ts` (idempotent demo seeder)
  - `database/scripts/check-connection.ts` (read-only connectivity and record diagnostic utility)
  - `database/README.md` (evaluator orientation guide)
- Configured Prisma v6.2.0 discovery in `package.json`:
  - `"prisma": { "schema": "database/prisma/schema.prisma", "seed": "tsx database/prisma/seed.ts" }`
  - NPM scripts: `db:validate`, `db:generate`, `db:migrate`, `db:status`, `db:seed`, `db:check`.
- Preserved PostgreSQL instance on port 5432 and all demo records.
- Verified:
  - `npm run db:validate` (exit 0)
  - `npm run db:generate` (exit 0)
  - `npm run db:status` (exit 0, up to date with 1 applied migration)
  - `npm run typecheck` (exit 0)
  - `npm run build` (exit 0)
  - `npm run db:check` (exit 0, 3 demo users, 1 period, 1 activity, 7 variants)
  - `npm run test:unit` (exit 0, 80 tests passing)

---

## Open Dependency Requests

None. Database subsystem is clean, consolidated in `database/`, and fully verified.

