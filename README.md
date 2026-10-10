# README — Skyline Student Association ERP

> **Status: Planned.** No application code exists yet. Commands marked **(planned)** will work after scaffold and setup.
> Stack updated per ADR-012: local PostgreSQL + Prisma + Better Auth replaces Supabase.

See [`brain.md`](./brain.md) for current state, blockers and next tasks.

---

## Project Overview

Skyline is a full-stack club ERP for a single student association. It connects memberships, ticketed events, merchandise orders, volunteer tasks, expense reimbursements, announcements and a committee handover tool in one responsive web application.

**Three workspaces, one database:**

| Workspace | Audience | URL prefix |
|---|---|---|
| Discover Skyline | Public | `/` |
| My Skyline | Signed-in students | `/me` |
| Club Desk | Officers and treasurer | `/desk` |

**Key differentiators:** Activity Hub (one page connects tickets/tasks/money/updates), Financial Evidence Panel (totals drill down to source records), Committee Handover Snapshot (dated, frozen, printable).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js App Router (TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Local PostgreSQL (native install or Docker) |
| ORM / Migrations | Prisma ORM + Prisma Migrate |
| Auth | Better Auth (email/password; Prisma adapter; runs inside Next.js) |
| Storage | Local filesystem (`uploads/receipts/` outside `public/`) |
| Validation | Zod |
| Email | Provider adapter (Resend / SendGrid / etc.) |
| Payment | Demo adapter; optional Razorpay/Stripe test adapter |
| QR | QR generation + camera scanner library |
| Deployment | Persistent-runtime host (Railway, Fly.io, VPS) or local demo machine |

> Note: Supabase services (Auth, Storage, hosted PostgreSQL, JS client, RLS) are not used. See ADR-012 in docs/DECISIONS.md.

---

## Repository Structure (Planned)

```
project root/
├── app/
│   ├── (public)/          # Discovery pages
│   ├── (auth)/            # /login, /signup
│   ├── (member)/me/       # Student workspace
│   ├── (desk)/desk/       # Staff workspace
│   └── api/
│       ├── auth/[...all]/ # Better Auth handler (GET + POST)
│       └── v1/            # Route Handlers (thin HTTP layer)
│           └── internal/  # Job runner endpoint
├── components/
│   ├── ui/                # shadcn/ui primitives
│   └── domain/            # Skyline-specific domain components
├── lib/
│   ├── auth/              # Better Auth instance + capability helpers
│   ├── prisma.ts          # Singleton Prisma client
│   ├── schemas/           # Zod request/response schemas; shared enums
│   ├── services/          # Domain services: membership, sales, activities, claims, cashbook
│   └── providers/         # Payment and email provider adapters
├── prisma/
│   ├── schema.prisma      # Auth models + domain models (single file)
│   └── migrations/        # Prisma-managed migration history (committed)
├── uploads/               # Private receipt storage (outside public/; gitignored content)
├── tests/
│   ├── integration/       # Business logic, transactions, concurrency, auth tests
│   └── e2e/               # Core browser journey tests
├── docs/                  # Project documentation
├── .agents/               # Agent rules and workflows
├── .env.example           # Environment variable template (no real secrets)
├── brain.md               # Project memory (read first every session)
├── AGENTS.md              # Agent conduct rules
└── README.md              # This file
```

---

## Prerequisites

- Node.js 20+ (lock version in `.nvmrc` or `package.json#engines`)
- PostgreSQL 15+ — native install or Docker
- Git

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values. **Never commit real secrets.**

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Better Auth
BETTER_AUTH_SECRET=your-32-char-random-secret
BETTER_AUTH_URL=http://localhost:3000

# Database (server-only — never NEXT_PUBLIC_)
DATABASE_URL="postgresql://skyline_app:change-in-dev@127.0.0.1:5432/skyline_dev"
DATABASE_URL_TEST="postgresql://skyline_app:change-in-dev@127.0.0.1:5432/skyline_test"

# Private receipt storage (server-only; must be outside the project public/ directory)
UPLOAD_DIR=/absolute/path/to/uploads/receipts
MAX_UPLOAD_BYTES=5242880

# Ticket token encryption (server-only; 32-byte hex)
RECEIPT_TOKEN_ENCRYPTION_KEY=your-32-byte-hex-key

# Email provider (server-only)
EMAIL_PROVIDER=resend
EMAIL_API_KEY=your-email-api-key
EMAIL_FROM_ADDRESS=no-reply@skyline.club

# Payment
PAYMENT_MODE=demo
# PAYMENT_PROVIDER_KEY=your-test-key
# PAYMENT_WEBHOOK_SECRET=your-webhook-secret

# Job runner (server-only)
JOB_RUNNER_SECRET=your-job-runner-secret
```

Variables that DO NOT exist in this project (removed per ADR-012):
- `NEXT_PUBLIC_SUPABASE_URL` — removed
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — removed
- `SUPABASE_SERVICE_ROLE_KEY` — removed

---

## Database Setup (Planned)

### 1. Create PostgreSQL user and databases

```bash
# As postgres superuser
psql -U postgres -c "CREATE USER skyline_app WITH PASSWORD 'change-in-dev';"
psql -U postgres -c "CREATE DATABASE skyline_dev  OWNER skyline_app;"
psql -U postgres -c "CREATE DATABASE skyline_test OWNER skyline_app;"
psql -U postgres -c "ALTER USER skyline_app CREATEDB;"   # needed for prisma migrate dev
```

### 2. Run migrations and seed

```bash
# Apply all migrations to dev DB
npx prisma migrate dev          # (planned)

# Seed demo data
npm run db:seed                 # (planned)
```

Migrations live in `prisma/migrations/` as Prisma-managed files. One person owns migration sequencing. Never hand-edit applied migration files — add a new one instead.

### 3. Generate Prisma client

```bash
npx prisma generate             # (planned — also runs automatically after migrate dev)
```

---

## Local Development (Planned)

```bash
# 1. Install dependencies
npm install                     # (planned — after scaffold)

# 2. Copy and fill environment variables
cp .env.example .env.local

# 3. Start PostgreSQL (if not already running)
# Native: ensure postgresql service is running
# Docker: docker compose up -d postgres

# 4. Set up database
npx prisma migrate dev
npm run db:seed

# 5. Start development server
npm run dev
# Open http://localhost:3000
```

---

## Available Scripts (Planned)

| Script | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Production build |
| `npm run lint` | ESLint + TypeScript type check |
| `npm run test:unit` | Unit tests |
| `npm run test:integration` | Integration tests against skyline_test DB |
| `npm run test:e2e` | End-to-end browser tests |
| `npm run db:seed` | Seed demo accounts and initial data |
| `npm run db:reset` | Reset dev DB and re-seed (WARNING: destructive) |

---

## Testing (Planned)

```bash
npm run test:integration        # Business logic, state machines, concurrency (planned)
npm run test:e2e                # Core browser journey (planned)
```

Integration tests use `DATABASE_URL_TEST` (skyline_test DB). Never run tests against skyline_dev.

See [`docs/TESTING.md`](./docs/TESTING.md) for strategy, fixtures, acceptance matrix and evidence rules.

---

## Demo Accounts (Planned — No Real Passwords Here)

| Role | Email | Notes |
|---|---|---|
| Student (active member) | student@demo.skyline | Active membership, demo dues paid |
| Student (non-member) | guest@demo.skyline | No membership |
| Officer | officer@demo.skyline | Can manage events, tasks, stock |
| Treasurer | treasurer@demo.skyline | Can review claims, record payouts |
| Door staff | door@demo.skyline | Check-in only for demo activity |

Set passwords in seed script. Never commit real passwords.

---

## Deployment Outline (Planned)

### Demo Machine (Hackathon)

1. Clone repo; `npm install`.
2. Install and start local PostgreSQL.
3. Set all env vars in `.env.local`.
4. `npx prisma migrate deploy` — applies migrations.
5. `npm run db:seed` — seeds demo data.
6. `npm run dev` or `npm run build && npm start`.
7. Access from jury devices via local network IP or ngrok tunnel.
8. PostgreSQL port 5432 must NOT be exposed on the local network.

### Hosted Deployment (Post-Hackathon)

> WARNING: Vercel serverless functions cannot reach localhost PostgreSQL and have ephemeral filesystems. Use Railway, Fly.io, Render or a VPS with persistent disk.

1. Push code to GitHub.
2. Connect to Railway / Fly.io / Render / VPS.
3. Provision PostgreSQL instance on the same platform or in the same VPC.
4. Set all production environment variables.
5. `npx prisma migrate deploy` in the deploy pipeline.
6. Mount a persistent volume for `UPLOAD_DIR`.
7. Confirm `PAYMENT_MODE != demo` in production.
8. Verify HTTPS, PostgreSQL not publicly exposed, `uploads/` not in `public/`.

---

## Troubleshooting

| Problem | Check |
|---|---|
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL service not running; start the service |
| `role "skyline_app" does not exist` | Re-run user creation SQL as postgres superuser |
| `database "skyline_dev" does not exist` | Re-run database creation SQL |
| Migration error on first run | Check `DATABASE_URL` in `.env.local`; run `npx prisma migrate dev` |
| Prisma migration state mismatch | Check `_prisma_migrations` table; `prisma migrate resolve` if needed |
| Port 5432 already in use | Another PostgreSQL running; check with `lsof -i :5432` |
| Better Auth session not persisting | Check `BETTER_AUTH_SECRET` is set; verify cookie settings |
| Email not sending | Verify `EMAIL_API_KEY` and from-address domain verified |
| Receipt upload failing | Check `UPLOAD_DIR` exists and is writable; check `MAX_UPLOAD_BYTES` |
| Payment callbacks not received | Use ngrok for local webhook testing; verify `PAYMENT_WEBHOOK_SECRET` |

---

## Documentation Links

| Document | Purpose |
|---|---|
| [`brain.md`](./brain.md) | Start here — current state and next tasks |
| [`docs/PRD.md`](./docs/PRD.md) | Full requirements and acceptance criteria |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Schema, API contracts, transaction design |
| [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md) | Visual design and screen specifications |
| [`docs/TASKS.md`](./docs/TASKS.md) | 24-hour delivery backlog |
| [`docs/DECISIONS.md`](./docs/DECISIONS.md) | Why we made each key choice (incl. ADR-012: Supabase → local) |
| [`docs/TESTING.md`](./docs/TESTING.md) | Test strategy and acceptance evidence |
| [`docs/SECURITY.md`](./docs/SECURITY.md) | Security policy and role matrix |

---

## Using Agent Rules and Workflows

- **Rules** in `.agents/rules/` are Markdown guidance files. Read the relevant rule file before implementing code in that area.
- **Workflows** in `.agents/workflows/` describe repeatable procedures. Follow the workflow for your task type.
- Rules and workflows are **not automatically executed** — they are read and followed by the implementing agent or developer.
- `AGENTS.md` contains general agent conduct rules (commits, file structure, behaviour).

---

_Last updated: 2026-10-10 | Stack: Next.js + Local PostgreSQL + Prisma + Better Auth_
