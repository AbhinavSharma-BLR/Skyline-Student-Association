# README — Skyline Student Association ERP

> **Status: Active & Live Database Integrated.**
> Real PostgreSQL database running on local machine, connected with Prisma ORM, Better Auth, and 41 Next.js 15 App Router API routes.
> Verified with 101 automated tests (75 unit tests + 26 live database integration tests).

See [`brain.md`](./brain.md) for current state, architecture, and verification evidence.

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
| Framework | Next.js 15 App Router (TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Local PostgreSQL 16 (native portable / service / Docker) |
| ORM / Migrations | Prisma ORM 6 + Prisma Migrate (custom check constraints & partial unique indexes) |
| Auth | Better Auth (email/password with argon2id / scrypt; Prisma adapter; runs inside Next.js) |
| Storage | Local filesystem (`uploads/receipts/` outside `public/` with magic byte validation) |
| Validation | Zod |
| Email | Provider adapter (ConsoleEmailAdapter in dev; Resend / SendGrid in prod) |
| Payment | DemoPaymentAdapter (isolated zero-cost simulation guarded by `PAYMENT_MODE=demo`) |
| Concurrency | Atomic row locks (`SELECT ... FOR UPDATE`), partial unique indexes, idempotency keys |

---

## Prerequisites

- **Node.js**: v20+ or v22+
- **PostgreSQL**: v15+ or v16+ (local native install or Docker container)
- **Git**

---

## Environment Variables

Copy `.env.example` to `.env` (or `.env.local`). **Never commit real secrets.**

```env
# Database connection URL (Prisma ORM)
DATABASE_URL="postgresql://skyline_dev:localpassword@localhost:5432/skyline_dev?schema=public&connection_limit=10"

# Better Auth Configuration
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-32-character-random-secret-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Local private file storage for receipts
UPLOAD_DIR="./uploads"

# Encryption & Background Job Secrets
RECEIPT_TOKEN_ENCRYPTION_KEY="your-32-char-encryption-key-for-qr"
JOB_RUNNER_SECRET="your-job-runner-secret"

# Payment and Email Providers
PAYMENT_MODE="demo"
EMAIL_API_KEY="demo_email_api_key_placeholder"
```

---

## Local Database Setup & Startup

### 1. Start Local PostgreSQL

Ensure PostgreSQL is running on port 5432 with adequate connection limits:

- **Native Windows (Portable / Service):**
  ```powershell
  # If using portable PostgreSQL:
  & "D:\pgsql\pgsql\bin\postgres.exe" -D "D:\pgsql\data" -c max_connections=300
  ```
- **Linux / macOS Service:**
  ```bash
  sudo systemctl start postgresql
  # or: brew services start postgresql@16
  ```
- **Docker Container:**
  ```bash
  docker run -d --name skyline_postgres \
    -e POSTGRES_USER=skyline_dev \
    -e POSTGRES_PASSWORD=localpassword \
    -e POSTGRES_DB=skyline_dev \
    -p 5432:5432 postgres:16-alpine
  ```

### 2. Apply Migrations

Apply committed Prisma migrations and domain SQL constraints to the database:
```bash
npm run db:migrate
# or: npx prisma migrate deploy
```

*(Optional: validate schema, check status, or regenerate client)*
```bash
npm run db:validate
npm run db:status
npm run db:generate
```

### 3. Seed Demo Data

Populate the database with pre-configured accounts, membership period, products, activities, and tasks:
```bash
npm run db:seed
```

### 4. Check Connection & Record Counts

Safely verify connectivity, server version, port, and demo record counts:
```bash
npm run db:check
```

### 5. Start the Application

- **Development Mode:**
  ```bash
  npm run dev
  ```
- **Production Mode:**
  ```bash
  npm run build
  npm start
  ```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verification & Testing

Our test suite tests against the live local PostgreSQL instance without fake rows or mock database doubles.

```bash
# Run all 107 tests (80 unit tests + 27 live database tests)
npm test

# Run only unit & invariant tests (80 tests)
npm run test:unit

# Run only live database integration workflows (27 tests)
npm run test:integration

# Run strict TypeScript type check
npm run typecheck

# Run production build compilation
npm run build
```

---

## Demo Accounts & Authentication Setup

Demo accounts are hashed and managed via Better Auth. Credentials are configured in ignored local configuration (`.env.local`) to prevent secret exposure:

| Role | Default Email | Local Config Variable | Privileges & Demo Scope |
|---|---|---|---|
| **Student (Member)** | `student@skyline.edu` | `DEMO_STUDENT_PASSWORD` | Active member profile, can book events, buy merchandise, submit reimbursement claims |
| **Club Officer** | `officer@skyline.edu` | `DEMO_OFFICER_PASSWORD` | Can manage activities, variant stock, volunteer tasks, announcements, desk pickup |
| **Club Treasurer** | `treasurer@skyline.edu` | `DEMO_TREASURER_PASSWORD` | Can review reimbursement claims, execute payouts, inspect cashbook ledger & summaries |

To seed demo data without mutating or overwriting existing accounts or passwords:
```bash
npm run db:seed
```
Repeated seeding is strictly idempotent and preserves existing user records.

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
| [`database/README.md`](./database/README.md) | Database subsystem & evaluator orientation guide |

---

## Using Agent Rules and Workflows

- **Rules** in `.agents/rules/` are Markdown guidance files. Read the relevant rule file before implementing code in that area.
- **Workflows** in `.agents/workflows/` describe repeatable procedures. Follow the workflow for your task type.
- Rules and workflows are **not automatically executed** — they are read and followed by the implementing agent or developer.
- `AGENTS.md` contains general agent conduct rules (commits, file structure, behaviour).

---

_Last updated: 2026-10-10 | Stack: Next.js + Local PostgreSQL + Prisma + Better Auth_
