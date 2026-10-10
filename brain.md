# brain.md — Skyline Student Association: Project Memory

> **Read this first at the start of every work session.**
> Keep it current. Do not duplicate entire specs here — link to them.

---

## Project Purpose

**Skyline Student Association ERP** — one web platform connecting memberships, ticketed events, merchandise, volunteer tasks, reimbursements, announcements and committee handovers for a single student club.

**Product promise:** Every campus activity has a responsible person, every payment has a source, and every incoming committee inherits a clear picture.

---

## Current Phase

**Phase:** Implementation Planning Complete — Ready for role selection
**Status:** All planning docs created. Four-lane ownership defined. Integration contract published. No application code exists.

> Each developer selects their role (see §"How to Resume Work" below) and begins Phase 1 tasks.
> No code is marked complete until it works and passes its acceptance criteria.

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

**Milestone 0 — Documentation and Planning Foundation**
Goal: All planning docs written, team structure defined, integration contract published.
Status: **Complete.** Architecture, ownership, contracts, and task plan all consistent with local PostgreSQL + Prisma + Better Auth stack.

---

## Next Three Actionable Tasks (Per Lane)

| Lane | First Task | Activation Phrase |
|---|---|---|
| DB Developer | **P1-DB-01** — PostgreSQL setup + initial Prisma schema | `"I am doing database"` |
| Backend Developer | **P1-BE-01** — Better Auth, session helpers, API foundation | `"I am doing backend"` |
| Student Frontend | **P1-SF-01** — UI foundation, public layout, login/signup | `"I am doing student frontend"` |
| Management Frontend | **P1-MF-01** — Club Desk layout, restricted-route shell | `"I am doing admin frontend"` |

> DB and BE must complete Phase 1 tasks before SF and MF integrate real data.
> SF and MF can build shells and layouts in parallel using mock data behind a flag.

See [`docs/TASKS.md`](./docs/TASKS.md) for full backlog and status.

Before T001: confirm competition rules do not mandate Odoo or another platform (BQ1).

---

## Blockers and Open Questions

| # | Question | Blocking |
|---|---|---|
| BQ1 | Competition rules mandate Odoo or another stack? | Stack finalization (verify before scaffold) |
| BQ2 | Which email provider (Resend, SendGrid, Postmark)? | Email adapter |
| BQ3 | Payment test-provider credentials available (Razorpay/Stripe test)? | Payment beyond demo |
| BQ4 | Configured membership period end date for this year? | Period seed data |
| BQ5 | Deployment host for demo machine? (local laptop, Railway, ngrok?) | Demo connectivity |
| BQ6 | Membership dues amount for this year (INR)? | Seed/demo data |
| BQ7 | PostgreSQL install method for each team member? (native vs Docker) | Local dev setup |

---

## Last Verified Checks

| Check | Date | Result |
|---|---|---|
| Documentation authored | 2026-10-10 | Complete (revised per ADR-012) |
| TEAM_HANDOVER.md | 2026-10-10 | Created — teammate onboarding doc with setup, env vars, and first tasks |
| TEAM_OWNERSHIP.md | 2026-10-10 | Exists — four-lane ownership, file map, dependency protocol |
| TASKS.md | 2026-10-10 | Exists — four-phase plan, per-lane tasks, phase gates |
| INTEGRATION_CONTRACT.md | 2026-10-10 | Exists — 12 response shapes, enums, HTTP conventions |
| Progress logs | 2026-10-10 | All four created in docs/progress/ |
| Application code | 2026-10-10 | **None exists** — package.json, prisma/, lib/, app/ all absent |
| Migrations | 2026-10-10 | **None written or run** |
| Tests | 2026-10-10 | **None written or run** |
| Deployment | 2026-10-10 | **Not started** |
| Supabase references in docs | 2026-10-10 | Removed / replaced per ADR-012 |

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
