# brain.md — Skyline Student Association: Project Memory

> **Read this first at the start of every work session.**
> Keep it current. Do not duplicate entire specs here — link to them.

---

## Project Purpose

**Skyline Student Association ERP** — one unified web platform connecting memberships, ticketed events, merchandise, volunteer tasks, reimbursements, announcements and committee handovers for a single student club.

**Product promise:** Every campus activity has a responsible person, every payment has a source, and every incoming committee inherits a clear picture.

---

## Current Phase

**Phase:** Integrated Demo Finalized & Guest Student Workspace Verified
**Status:** 
- Unified Next.js 15 App Router application on single origin (`http://localhost:3000`).
- Clean Guest Header: "Guest Account · Dues Pending", greeting set to "Welcome, Guest!", developer annotations removed, "View Perks & Breakdown" button removed, and "Activate Membership" button preserved with database price.
- Workspace Navigation Order: Exactly `1. Guest Pass & Dues`, `2. Events`, `3. My Tickets (count)`, `4. Merch Orders (count)`. Reimbursements tab cleanly excluded for guests.
- Real Events Section: Lists published club events from `/api/v1/activities` with title, date/time, venue, seats remaining, member savings, and dynamic price buttons (`Book Ticket · ₹500`).
- Real Ticket Issuance: Connected to `POST /api/v1/bookings` -> demo-payment modal -> `POST /api/v1/bookings/[id]/confirm`, refreshing tickets, switching to My Tickets tab, and badge labelled "Booked Ticket".
- Clean My Tickets: Removed "Demo: Buy Ticket as Guest", primary "Browse Campus Events" button switching to Events section, clean empty state when no tickets exist.
- Dynamic Membership Savings Navigation: "Activate Membership to Save ₹..." smoothly scrolls to `#annual-dues-card` without accidental activation.
- Truthful Merchandise Visibility: Purchased merchandise showcase rendered ONLY when `confirmedOrders.length > 0`. Zero confirmed purchases hides showcase cleanly and offers catalog browsing.
- Internal Annotations Removed: Stripped all internal PRD annotations (`PRD §...`, `R05`, `R13`, `R14`, `R15`, `Phase F`) from UI strings across `/me` and `/desk`.
- Real PostgreSQL 16 active on `localhost:5432` with database `skyline_dev` preserved without reseeding.
- All 80 unit tests across 10 suites passing, clean TypeScript typecheck (`tsc --noEmit`), and verified Next.js production build (`next build`).

---

## Stack (Final — Locked per ADR-012)

| Layer | Technology |
|---|---|
| UI | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| HTTP API | Next.js Route Handlers (Node.js runtime) |
| Validation | Zod |
| Database | Local PostgreSQL (native install or Docker) |
| ORM | Prisma ORM + Prisma Migrate |
| Auth | Better Auth (email/password; Prisma adapter; runs inside Next.js) |
| Auth storage | `user`, `session`, `account`, `verification` tables via Prisma |
| Storage | Local filesystem `uploads/receipts/` (outside `public/`) |
| Email | Provider adapter (Resend/SendGrid/etc.) |
| Payment | Demo adapter (visibly labelled); optional test-provider upgrade |
| QR | QR generator + camera scanner library |
| Deployment | Persistent-runtime host (local demo machine, Railway, Fly.io, VPS) |

**What was replaced (and why):**
- Supabase hosted PostgreSQL → local PostgreSQL (no external dependency, works offline)
- Supabase Auth → Better Auth (runs inside Next.js; stores in our PostgreSQL via Prisma)
- Supabase Storage → local `uploads/receipts/` directory (no external dependency)
- Supabase JS client → Prisma ORM (type-safe, migration-managed)
- Supabase RLS → server-side authorization in Route Handlers and services

See ADR-012 in docs/DECISIONS.md for full replacement table and rationale.

---

## Scope Summary

**In scope (P0):** Membership dues/renewal, ticketed events with capacity, QR check-in, merchandise with size-variant stock, reimbursement claims, announcements, consolidated finance cashbook, responsive web.

**In scope (P1):** Activity Hub, financial evidence drill-down, committee handover snapshot, club health alerts.

**Explicitly out of scope:** Voting, native app, shipping, multi-campus, facial recognition, bank integration, full double-entry accounting, automated refunds, offline multi-device scanning.

One club · INR paise · One membership plan per annual period.

---

## Key Business Invariants

1. **Server owns prices.** Browser never calculates authoritative prices, roles or inventory counts.
2. **Money is integer paise.** No floating point. INR only. Explicit direction in cashbook (INFLOW/OUTFLOW).
3. **Approval ≠ payout.** An approved claim is an obligation. Only a recorded payout entry reduces cash balance.
4. **One confirmed fulfilment per purchase.** Second successful payment → reconciliation exception, not duplicate ticket/order.
5. **Capacity is enforced atomically.** Ticket and variant reservations use `SELECT ... FOR UPDATE` in `prisma.$transaction`.
6. **Paid history is immutable.** No deletion or silent editing of confirmed purchases, cashbook entries or snapshots.
7. **Member eligibility at purchase time.** Legitimately purchased member-price ticket remains valid if membership later expires.
8. **Snapshot content is frozen.** A handover snapshot JSON does not change after generation.
9. **Self-approval and self-payout are forbidden.** Enforced in service layer before DB write; not just UI gating.
10. **Demo payments are visibly labelled.** Demo-confirm endpoint isolated and marked simulated money; disabled in production.

---

## File Index

| File | Owns |
|---|---|
| [`brain.md`](./brain.md) | Current state, links, blockers, next tasks |
| [`README.md`](./README.md) | Setup, dev guide, commands, environment |
| [`docs/PRD.md`](./docs/PRD.md) | Product requirements, user journeys, acceptance criteria |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Technical truth: schema, API, transactions, auth, storage |
| [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md) | UX/visual tokens, screen specs, component behaviour |
| [`docs/TASKS.md`](./docs/TASKS.md) | Four-phase task backlog with per-role tasks and gates |
| [`docs/DECISIONS.md`](./docs/DECISIONS.md) | Architectural decision records (incl. ADR-012) |
| [`docs/TESTING.md`](./docs/TESTING.md) | Testing strategy, fixtures, acceptance matrix |
| [`docs/SECURITY.md`](./docs/SECURITY.md) | Security design, authorization, audit |
| [`docs/TEAM_OWNERSHIP.md`](./docs/TEAM_OWNERSHIP.md) | Four-person lane ownership, file map, shared files, integration rules |
| [`docs/INTEGRATION_CONTRACT.md`](./docs/INTEGRATION_CONTRACT.md) | Shared API response shapes, enums, conventions |
| [`docs/progress/database.md`](./docs/progress/database.md) | DB Developer progress log |
| [`docs/progress/backend.md`](./docs/progress/backend.md) | Backend Developer progress log |
| [`docs/progress/student-frontend.md`](./docs/progress/student-frontend.md) | Student Frontend Developer progress log |
| [`docs/progress/management-frontend.md`](./docs/progress/management-frontend.md) | Management Frontend Developer progress log |
| [`database/README.md`](./database/README.md) | Database subsystem & evaluator orientation guide |
| [`AGENTS.md`](./AGENTS.md) | Agent rules (general conduct, commits, folder structure) |
| [`.agents/rules/coding-standards.md`](./.agents/rules/coding-standards.md) | TypeScript and module conventions |
| [`.agents/rules/frontend.md`](./.agents/rules/frontend.md) | Frontend implementation obligations |
| [`.agents/rules/backend-api.md`](./.agents/rules/backend-api.md) | Route Handler and service obligations |
| [`.agents/rules/database.md`](./.agents/rules/database.md) | Prisma, migrations, transactions, schema obligations |
| [`.agents/rules/testing.md`](./.agents/rules/testing.md) | Test obligations and evidence rules |
| [`.agents/rules/security.md`](./.agents/rules/security.md) | Security obligations |
| [`.agents/workflows/implement-feature.md`](./.agents/workflows/implement-feature.md) | How to implement a feature slice |
| [`.agents/workflows/plan-feature.md`](./.agents/workflows/plan-feature.md) | How to plan a feature |
| [`.agents/workflows/review-change.md`](./.agents/workflows/review-change.md) | How to review a change |
| [`.agents/workflows/verify-release.md`](./.agents/workflows/verify-release.md) | Pre-release checklist |
| [`.agents/workflows/update-project-memory.md`](./.agents/workflows/update-project-memory.md) | How to update brain.md |

---

## Document Ownership

| Decision Area | Owner |
|---|---|
| Product requirements and acceptance criteria | `docs/PRD.md` |
| Schema, API, transactions, auth, local storage | `docs/ARCHITECTURE.md` |
| UI behaviour, visual tokens, screen specs | `docs/DESIGN_SYSTEM.md` |
| Delivery status and task tracking | `docs/TASKS.md` |
| Architectural decisions | `docs/DECISIONS.md` |
| Test strategy and evidence | `docs/TESTING.md` |
| Security policy | `docs/SECURITY.md` |
| Developer setup | `README.md` |
| Current state + links | `brain.md` (this file) |

---

## Current Milestone

**Milestone 1 — Backend & Database Foundation & Integration**
Goal: Run real local PostgreSQL, apply Prisma schema and reproducible migrations with custom check constraints, connect Better Auth, seed demo data, and verify full end-to-end workflows.
Status: **Complete.**
- Real PostgreSQL 16 running on local machine (port 5432).
- Database subsystem consolidated in `database/` (`schema.prisma`, `migrations/`, `seed.ts`, `scripts/check-connection.ts`, `README.md`).
- Prisma migration `20261010165427_init_skyline_schema` applied.
- All check constraints and partial unique indexes in place.
- Seed script (`database/prisma/seed.ts`) successfully seeded demo users and data.
- 107 automated tests passing (80 unit tests + 27 live database tests).
- 41 dynamic Next.js API routes compiled and tested on running server.

---

## Next Actionable Tasks (Frontend Integration)

| Lane | Next Task | Description |
|---|---|---|
| Student Frontend | **P2-SF-01** | Connect student workspace (`/me`, tickets, memberships, orders) to live API routes |
| Management Frontend | **P2-MF-01** | Connect Club Desk (`/desk`, tasks, claims review, attendance scanning) to live API routes |
| Backend & DB | **Complete** | All backend services, auth endpoints, and database models verified and operational |

---

## Last Verified Checks

| Check | Date | Result |
|---|---|---|
| Documentation authored | 2026-10-10 | Complete (revised per ADR-012) |
| Local PostgreSQL Server | 2026-10-10 | Running locally on port 5432 (`max_connections=300`) |
| Database Reorganization | 2026-10-10 | Consolidated in `database/` with `database/README.md` guide |
| Prisma Schema & Migrations | 2026-10-10 | Discovered at `database/prisma/schema.prisma` (`20261010165427_init_skyline_schema` applied) |
| Prisma Client Generation | 2026-10-10 | Generated v6.19.3 |
| Database Seeding | 2026-10-10 | Complete (`npm run db:seed` seeded students, officers, activities, merchandise) |
| Database Connectivity & Counts | 2026-10-10 | Passed (`npm run db:check`: 3 demo users, 1 period, 1 activity, 7 variants) |
| Next.js Server & Routes | 2026-10-10 | Compiled & running on port 3000 (41 dynamic API routes) |
| Strict TypeScript Typecheck | 2026-10-10 | 0 errors (`npm run typecheck`) |
| Production Build | 2026-10-10 | 0 errors (`npm run build`) |
| Unit & Invariant Tests | 2026-10-10 | 80 passed, 0 failed (`npm run test:unit`) |
| Live PostgreSQL Workflows | 2026-10-10 | 27 passed, 0 failed (`npm run test:integration`) |


---

## Evaluator Live Browser Demo Walkthrough

The integrated application runs on a single origin at **`http://localhost:3000`** backed by PostgreSQL on `localhost:5432`.

### Step 1: Homepage & Brand Inspection (`/`)
1. Open `http://localhost:3000` in the browser.
2. Confirm the Skyline visual identity (Deep Cobalt Blue `#0047AB`, clean architecture, interactive cards).
3. Confirm public event tickets display member vs. guest pricing comparisons.

### Step 2: Student Login & Session Verification (`/login`)
1. Click **Sign in** or navigate to `http://localhost:3000/login`.
2. Click the demo fast-fill button: **⚡ Student (Sam Student)**.
3. Credentials populated: `student@skyline.edu` / `StudentPassword123!`.
4. Click **Sign in to Skyline** → redirects to `http://localhost:3000/me`.
5. Verify authenticated session survives page refresh (F5).

### Step 3: Membership Dues Activation via Demo Payment (`/me`)
1. In Student Workspace (`/me`), observe the membership status card.
2. If membership is unactivated, click **⚡ Activate Membership (Demo ₹200) →**.
3. Atomic transaction executes: creates purchase record, logs demo payment attempt (`provider: "demo"`), activates membership, and posts an inflow entry to the cashbook ledger.
4. Membership badge updates immediately to **Active Member**.

### Step 4: Role-Based Access Control (RBAC) Protection (`/desk`)
1. While logged in as Sam Student, navigate to `http://localhost:3000/desk`.
2. **Access Control Barrier:** The system blocks access with **403 FORBIDDEN · ACCESS CONTROL**.
3. Confirms that student accounts cannot access staff management operations.
4. Click **Sign out**.

### Step 5: Treasurer Audit & Cashbook Verification (`/desk`)
1. Navigate to `http://localhost:3000/login`.
2. Click the demo fast-fill button: **⚡ Treasurer (Trevor Treasurer)**.
3. Credentials populated: `treasurer@skyline.edu` / `TreasurerPassword123!`.
4. Click **Sign in to Skyline** → redirects directly to `http://localhost:3000/desk`.
5. Notice the **Club Desk · Treasury & Financial Audit** dashboard renders.
6. Click the **Cashbook Ledger** tab:
   - Notice the exact matching **Membership Dues** inflow entry (`INFLOW`, `category: MEMBERSHIP`) from Step 3.
   - All amounts are computed in integer paise without floating point inaccuracy.
7. Click the **Expense Claims Review Queue** tab:
   - Inspect reimbursement claims.
   - Verify PRD Invariant #9: self-approval and self-payout are strictly forbidden.

### Step 6: Officer Operations Dashboard (`/desk`)
1. Sign in as **Olivia Officer** (`officer@skyline.edu` / `OfficerPassword123!`).
2. Redirects to `http://localhost:3000/desk` → displays **Officer Operations Dashboard**.
3. Door QR Scanner, event capacity counters, size-variant inventory, and volunteer task lists are fully operational.

---

## How to Resume Work

**Developers:** Use your activation phrase to start:
- `"I am doing database"` — DB Developer → read P1-DB-01
- `"I am doing backend"` — Backend Developer → read P1-BE-01
- `"I am doing student frontend"` — Student Frontend → read P1-SF-01
- `"I am doing admin frontend"` — Management Frontend → read P1-MF-01

**After activation, the agent will:**
1. Read this file and your role's progress log in `docs/progress/`
2. Inspect actual code and unfinished changes
3. Identify the earliest ready task for your lane
4. State active role, phase, task ID, and owned paths
5. Implement ready tasks within your lane's ownership
6. Update your progress log with results
7. Report completed work, blockers, and next ready task

**Planning documents to read before coding:**
- `docs/TEAM_OWNERSHIP.md` — who owns what
- `docs/INTEGRATION_CONTRACT.md` — API shapes and enums
- `docs/TASKS.md` — your phase tasks with acceptance criteria
- `.agents/rules/` — coding obligations for your layer
- `docs/ARCHITECTURE.md` — technical source of truth

---

## How to Update Project Memory

Follow `.agents/workflows/update-project-memory.md`.

In brief: update **Current Phase**, **Milestone**, **Next Three Tasks**, **Blockers** and **Last Verified Checks**. Do not duplicate specs. Do not mark tasks complete without real evidence.

---

_Last updated: 2026-10-10 | Phase: Implementation Planning Complete — Team handover ready | No application code exists_
