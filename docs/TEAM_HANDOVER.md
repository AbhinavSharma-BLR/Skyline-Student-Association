# docs/TEAM_HANDOVER.md — New-Teammate Onboarding

**Last updated:** 2026-10-10 | **Verified by:** Lead architect
**Hackathon clock:** 24 hours total — Phase 1 begins when all four developers have read this file.

> This document tells you what the project is, what exists right now, and exactly what you need to do first.
> It does not describe planned features as complete. It does not contain secrets.

---

## 1. What We Are Building

**Skyline Student Association ERP** — a single responsive web application that connects:

| Feature | Student view | Officer/Treasurer view |
|---|---|---|
| Membership | Join, pay dues, see active card | Directory, renewal management |
| Events & Tickets | Browse, buy ticket, view QR pass | Create event, manage capacity, scan QR at door |
| Merchandise | Shop by size, track order | Inventory, mark collected |
| Tasks | See assigned tasks, update status | Create/assign tasks per activity |
| Reimbursements | Submit claim + receipt | Approve, reject, record payout |
| Announcements | Read updates | Draft and publish |
| Finance | — | Cashbook, reconciliation, drill-down |
| Handover | — | Frozen financial + activity snapshot for incoming committee |

**Three URL workspaces, one database:**

| Prefix | Who sees it |
|---|---|
| `/` | Public (no login) |
| `/me` | Any signed-in student |
| `/desk` | Officers and treasurer only |

---

## 2. Current Implementation Status

> Confirmed by repository inspection on 2026-10-10.

| Area | Status | Notes |
|---|---|---|
| Documentation | **Complete** | All planning docs written and internally consistent |
| Next.js scaffold | **Not started** | `package.json` does not exist yet |
| Prisma schema | **Not started** | `prisma/schema.prisma` does not exist yet |
| Better Auth setup | **Not started** | `lib/auth/auth.ts` does not exist yet |
| Any Route Handler | **Not started** | `app/api/` does not exist yet |
| Any frontend page | **Not started** | `app/` does not exist yet |
| Database migrations | **Not started** | No migrations written or run |
| Seed data | **Not started** | `prisma/seed.ts` does not exist yet |
| Tests | **Not started** | No test files |
| Deployment | **Not started** | No deployment config |

**The codebase is documentation only.** Every developer starts from a blank slate on Phase 1.

---

## 3. Tech Stack (Final — Do Not Deviate)

| Layer | Technology | Decision record |
|---|---|---|
| Framework | Next.js App Router + React + TypeScript | ADR-002 |
| Styling | Tailwind CSS + shadcn/ui | ADR-002 |
| HTTP API | Next.js Route Handlers (Node.js runtime) | ADR-002 |
| Database | **Local PostgreSQL 15+** (no Supabase) | ADR-012 |
| ORM | **Prisma ORM + Prisma Migrate** | ADR-012 |
| Auth | **Better Auth** (email/password; Prisma adapter; runs inside Next.js) | ADR-012 |
| File storage | **Local filesystem** `uploads/receipts/` outside `public/` | ADR-012 |
| Validation | Zod | ADR-002 |
| Payment | Demo adapter (visibly labelled "SIMULATED PAYMENT") | ADR-002 |
| Email | Provider adapter (Resend/SendGrid) | ADR-002 |

> ⚠️ Supabase is NOT used — not for auth, not for storage, not for the database. If any code imports `@supabase/supabase-js`, remove it.

---

## 4. Prerequisites — Install on Your Machine Before Starting

### Required

- **Node.js 20+** — check with `node -v`
- **PostgreSQL 15+** — native install or Docker
- **Git** — check with `git --version`

### PostgreSQL — Two Options

**Option A: Native install (Windows)**
- Download from https://www.postgresql.org/download/windows/
- Use pgAdmin or psql CLI to run the setup commands in §6

**Option B: Docker**
```bash
docker compose up -d postgres   # (after docker-compose.yml exists — Backend Dev will create it)
```

---

## 5. Getting the Repository

```bash
# Clone (or pull if already cloned)
git clone <repo-url> skyline
cd skyline/project\ root

# Install dependencies — AFTER Backend Dev has committed package.json and lockfile
npm install
```

> Until Phase 1 Backend task (P1-BE-01) is complete, `package.json` does not exist. You cannot `npm install` yet.

---

## 6. Database Setup

> Run this once per developer machine. Do this before running migrations.

```bash
# As the postgres superuser (psql prompt or pgAdmin)
CREATE USER skyline_app WITH PASSWORD 'change-in-dev';
CREATE DATABASE skyline_dev  OWNER skyline_app;
CREATE DATABASE skyline_test OWNER skyline_app;
ALTER USER skyline_app CREATEDB;   -- required for prisma migrate dev
```

After the DB Developer commits `prisma/schema.prisma` and the first migration:

```bash
# Apply migrations
npx prisma migrate dev

# Load demo seed data
npm run db:seed

# Optional: inspect in browser
npx prisma studio
```

> Migrations are NOT written yet. Do not run these commands until the DB Developer (P1-DB-01) is done.

---

## 7. Environment Variables

Copy `.env.example` to `.env.local` and fill in your local values.

> `.env.example` does not exist yet — Backend Dev commits it as part of P1-BE-01.

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Better Auth  (generate: openssl rand -base64 32)
BETTER_AUTH_SECRET=<your-32-char-random-secret>
BETTER_AUTH_URL=http://localhost:3000

# Database  (server-only — NEVER use NEXT_PUBLIC_ prefix)
DATABASE_URL="postgresql://skyline_app:change-in-dev@127.0.0.1:5432/skyline_dev"
DATABASE_URL_TEST="postgresql://skyline_app:change-in-dev@127.0.0.1:5432/skyline_test"

# Receipt storage  (server-only — absolute path outside project public/)
UPLOAD_DIR=/absolute/path/to/uploads/receipts
MAX_UPLOAD_BYTES=5242880

# Ticket encryption  (server-only — generate: openssl rand -hex 32)
RECEIPT_TOKEN_ENCRYPTION_KEY=<your-32-byte-hex-key>

# Email  (server-only — use test API key for hackathon)
EMAIL_PROVIDER=resend
EMAIL_API_KEY=<your-email-api-key>
EMAIL_FROM_ADDRESS=no-reply@skyline.club

# Payment  (demo mode — leave as-is for hackathon)
PAYMENT_MODE=demo

# Job runner  (server-only)
JOB_RUNNER_SECRET=<any-random-string>
```

**Variables that do NOT exist in this project (removed):**
```
NEXT_PUBLIC_SUPABASE_URL         ← removed
NEXT_PUBLIC_SUPABASE_ANON_KEY    ← removed
SUPABASE_SERVICE_ROLE_KEY        ← removed
```

> Never commit `.env.local`. It is already in `.gitignore`. The only env file you commit is `.env.example` (no real values).

---

## 8. Running Locally

> These commands work after Phase 1 scaffold is complete.

```bash
# Development server (hot reload)
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Run integration tests (against skyline_test database)
npm run test:integration

# Run E2E tests
npm run test:e2e
```

---

## 9. Your Role and First Task

### Four Lanes — Each Developer Picks One

| Lane | Activation phrase | First task | Details |
|---|---|---|---|
| **Database** | `"I am doing database"` | P1-DB-01 | PostgreSQL setup + initial Prisma schema |
| **Backend / Auth** | `"I am doing backend"` | P1-BE-01 | Next.js scaffold + Better Auth + session helpers |
| **Student Frontend** | `"I am doing student frontend"` | P1-SF-01 | Design tokens + login/signup screens |
| **Management Frontend** | `"I am doing admin frontend"` | P1-MF-01 | Club Desk layout + route guard shell |

### How to Start Your Lane

1. Read `brain.md` — current status and blockers
2. Read `docs/TEAM_OWNERSHIP.md` — what you own and what you do NOT touch
3. Read `docs/INTEGRATION_CONTRACT.md` — the API shapes your code must match
4. Read `docs/TASKS.md` — your Phase 1 task with full acceptance criteria
5. Read `.agents/rules/` — the obligation rules for your layer
6. Say your activation phrase to the agent to begin

### Phase 1 Dependency Order

```
DB Dev  → P1-DB-01 (schema applied)
            ↓
BE Dev  → P1-BE-01 (auth + session helpers committed)
            ↓ (lib/schemas and lib/auth/client.ts now available)
SF Dev  → P1-SF-01 (Tailwind + login/signup)
MF Dev  → P1-MF-01 (can start desk layout in parallel with SF)
```

SF and MF can begin building layouts in parallel once BE commits the Tailwind config and UI primitives. They must NOT wire real auth calls until `lib/auth/client.ts` is committed.

---

## 10. File Ownership Summary

> Full ownership rules: see `docs/TEAM_OWNERSHIP.md`

| You are | You own | You DO NOT edit |
|---|---|---|
| DB | `prisma/schema.prisma`, `prisma/migrations/**`, `prisma/seed.ts` | Any UI file, any route handler |
| BE | `lib/auth/**`, `lib/services/**`, `app/api/**`, `middleware.ts`, `package.json` | `prisma/schema.prisma`, any frontend page |
| SF | `app/(public)/**`, `app/(auth)/**`, `app/(member)/me/**`, `components/ui/**`, `tailwind.config.ts` | `app/api/**`, `app/(desk)/**` |
| MF | `app/(desk)/desk/**`, `components/desk/**`, `components/shared/**` | `app/api/**`, `components/ui/**` (import only) |

**Shared file — dependency request required to edit:**
- `package.json` → owned by BE; post a dependency request in your progress log
- `tailwind.config.ts` → owned by SF; post a dependency request in your progress log
- `lib/schemas/**` → owned by BE; import enums and types only

---

## 11. Integration Rules (Non-Negotiable)

1. **Never compute prices, roles, or stock in the browser.** Server does it; browser displays it.
2. **Import status enums from `lib/schemas/`** — never define `"active"` | `"pending"` locally.
3. **Money is integer paise across all API calls.** `INR 150.00 = 15000`. Display rounding is UI-only.
4. **Timestamps are UTC ISO 8601.** Display in `Asia/Kolkata` at UI layer only.
5. **No Prisma record returned directly as API response.** Route handlers return shaped objects per `INTEGRATION_CONTRACT.md`.
6. **Mock data is behind a flag.** `USE_MOCK_DATA=true` only. Removed before final demo.
7. **All financial mutations need an `Idempotency-Key` header.** Backend enforces; frontend supplies a `nanoid()` UUID per form submit.

---

## 12. Key Documents

| Document | What it contains |
|---|---|
| [`brain.md`](../brain.md) | Current project state — read this first every session |
| [`docs/TASKS.md`](./TASKS.md) | All tasks by phase and lane, with acceptance criteria |
| [`docs/TEAM_OWNERSHIP.md`](./TEAM_OWNERSHIP.md) | Who owns what file; dependency request format |
| [`docs/INTEGRATION_CONTRACT.md`](./INTEGRATION_CONTRACT.md) | API response shapes, enums, HTTP conventions |
| [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) | Schema, API design, auth, transactions |
| [`docs/PRD.md`](./PRD.md) | Product requirements, business rules |
| [`docs/DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | Visual tokens, screen specs, component guidelines |
| [`docs/SECURITY.md`](./SECURITY.md) | Auth rules, permissions, audit requirements |
| [`docs/DECISIONS.md`](./DECISIONS.md) | Why we made stack choices (ADR-012 = Supabase → local) |
| [`docs/progress/database.md`](./progress/database.md) | DB Dev live progress log |
| [`docs/progress/backend.md`](./progress/backend.md) | Backend Dev live progress log |
| [`docs/progress/student-frontend.md`](./progress/student-frontend.md) | SF Dev live progress log |
| [`docs/progress/management-frontend.md`](./progress/management-frontend.md) | MF Dev live progress log |

---

## 13. Phase 1 Gate — Before Anyone Moves to Phase 2

All four items must be confirmed before Phase 2 starts:

- [ ] `npm run dev` starts without errors on at least one machine
- [ ] `GET /api/v1/health` returns `{ "data": { "ok": true, "db": "connected" } }`
- [ ] Signup → session cookie → authenticated navigation visible
- [ ] Login → redirects to `/me`
- [ ] Logout → session cleared; navigation returns to unauthenticated state
- [ ] `/desk` without an officer session → redirected to `/login`
- [ ] Design tokens (colors, fonts) visible and matching DESIGN_SYSTEM.md

---

## 14. Open Blockers

| # | Question | Blocks |
|---|---|---|
| BQ1 | Do competition rules mandate Odoo or a different platform? | Entire stack — verify before writing code |
| BQ2 | Which email provider will we use (Resend, SendGrid, Postmark)? | Email adapter |
| BQ3 | Razorpay/Stripe test credentials available? | Real payment adapter (demo works without this) |
| BQ4 | Membership period start and end date for this year? | Seed data |
| BQ5 | Demo deployment host? (local laptop + ngrok, Railway, Fly.io?) | Demo connectivity |
| BQ6 | Membership dues amount (INR)? | Seed data |
| BQ7 | PostgreSQL install method per developer? (native Windows vs Docker) | P1-DB-01 setup |

---

## 15. Progress Log Format

Each developer maintains their own log file. Short entries, updated frequently.

```markdown
## [HH:MM] P1-DB-01 — Short description
Status: DONE
Evidence: Migration applied; Prisma Studio shows all tables
Next: P2-DB-01
Blockers: None
```

The Backend Developer consolidates all progress logs into `brain.md` at each phase gate.
