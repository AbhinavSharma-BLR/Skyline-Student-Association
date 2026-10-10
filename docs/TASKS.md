# docs/TASKS.md — Four-Person Implementation Plan

**Owner:** Backend Developer (integrator role). Each developer updates their own progress log; BE consolidates into brain.md at phase gates.
**Last updated:** 2026-10-10 | Stack: Next.js + Local PostgreSQL + Prisma + Better Auth
**Status:** Planning — no application code exists yet.

> Completion requires evidence. A page shell is not a completed feature. Mock data does not prove integration.
> See docs/TEAM_OWNERSHIP.md for ownership rules. See docs/INTEGRATION_CONTRACT.md for API shapes.

---

## Critical Path

```
[P1-DB-01 scaffold+schema] + [P1-BE-01 auth setup] + [P1-SF-01 UI foundation]
          ↓ (Phase 1 gate: app runs, login works)
[P2-DB-01 booking/payment tables] + [P2-BE-01 membership service] + [P2-SF-01 membership flow] + [P2-MF-01 member directory]
          ↓ (Phase 2 gate: join → pay → ticket → scan → finance updated)
[P3-DB-01 merch/claims tables] + [P3-BE-01 merch service] + [P3-SF-01 shop flow] + [P3-MF-01 claim review]
          ↓ (Phase 3 gate: full operations, finance reconciles)
[P4-DB-01 demo seed] + [P4-BE-01 hardening] + [P4-SF-01 polish] + [P4-MF-01 Time Capsule]
          ↓ (Phase 4 gate: tests pass, demo rehearsed)
```

---

## PHASE 1 — Foundation and Contracts
**Target: Hours 0–4**
**Gate: App runs locally, signup/login/logout works, unauthorized /desk access denied.**

---

### P1-DB-01 — PostgreSQL Setup and Initial Schema

| Field | Value |
|---|---|
| Phase | 1 |
| Owner | DB Developer |
| Status | TODO |
| Est | 2h |
| Deps | None |

**Goal:** Local PostgreSQL running with the full initial Prisma schema applied and core seed data working.

**Owned files:**
- `prisma/schema.prisma`
- `prisma/migrations/` (first two migrations)
- `prisma/seed.ts`
- `docs/progress/database.md`

**Inputs:** ARCHITECTURE.md §3 (schema), README.md (DB setup steps)
**Outputs:** Running DB; Prisma client generated; seed creates demo accounts

**Implementation steps:**
1. Create PostgreSQL users and databases: `skyline_dev`, `skyline_test`
2. Write `prisma/schema.prisma` — Better Auth models (user, session, account, verification) + domain models: Profile, Role, ClubSettings, MembershipPeriod, Membership, AuditEvent, IdempotencyRecord
3. Run `npx prisma migrate dev --name init-auth-and-core`
4. Add custom SQL migration for CHECK constraints (paise > 0, status enums)
5. Write `prisma/seed.ts` — demo accounts (student, officer, treasurer, door staff), MembershipPeriod, ClubSettings
6. Run `npm run db:seed`; verify in Prisma Studio

**Acceptance criteria:**
- [ ] `npx prisma migrate dev` completes without errors
- [ ] `prisma studio` shows all tables with correct columns
- [ ] `npm run db:seed` is idempotent (run twice, no duplicates)
- [ ] Demo student login works via Better Auth
- [ ] CHECK constraints reject negative paise values

**Dependency request to Backend:** Need `lib/prisma.ts` singleton and `DATABASE_URL` in `.env.example` before migrate can run. (P1-BE-01 dependency)

---

### P1-BE-01 — Better Auth, Session Helpers, and API Foundation

| Field | Value |
|---|---|
| Phase | 1 |
| Owner | Backend Developer |
| Status | TODO |
| Est | 2.5h |
| Deps | P1-DB-01 (schema must be applied) |

**Goal:** Better Auth running, session helpers implemented, shared schemas/errors committed, health check live.

**Owned files:**
- `package.json` + lockfile (install all dependencies)
- `.env.example`
- `next.config.ts`
- `middleware.ts`
- `lib/auth/auth.ts`
- `lib/auth/session.ts`
- `lib/auth/client.ts`
- `lib/prisma.ts`
- `lib/schemas/` (core enums: MembershipStatus, ClaimStatus, BookingStatus, OrderStatus, TaskStatus)
- `lib/api/errors.ts`
- `lib/env.ts`
- `app/api/auth/[...all]/route.ts`
- `app/api/v1/health/route.ts`
- `docs/progress/backend.md`

**Inputs:** ARCHITECTURE.md §4 (auth), INTEGRATION_CONTRACT.md §2 (session shape), .agents/rules/backend-api.md
**Outputs:** Working auth endpoints; session contract ready for frontends; status enums committed

**Implementation steps:**
1. Initialize Next.js project with TypeScript, Tailwind, shadcn/ui (`npx create-next-app`)
2. Install: `better-auth`, `@prisma/client`, `prisma`, `zod`, `nanoid`
3. Write `lib/env.ts` — validate all required env vars at startup
4. Write `lib/prisma.ts` — singleton PrismaClient
5. Write `lib/auth/auth.ts` — Better Auth with Prisma adapter, email/password provider
6. Write `lib/auth/session.ts` — `requireAuth()`, `requireRole()`, `requireOwner()`, `requireActivityStaff()`
7. Write `lib/auth/client.ts` — Better Auth browser client (export for frontend use)
8. Write `lib/api/errors.ts` — `SkylineError`, `handleApiError`
9. Write `lib/schemas/` — status enums and base response types
10. Write `app/api/auth/[...all]/route.ts` — Better Auth handler
11. Write `middleware.ts` — session cookie presence check; redirect unauthenticated users from `/me` and `/desk`
12. Write `app/api/v1/health/route.ts` — `{ data: { ok: true, db: "connected" } }`
13. Commit `.env.example` with all required variable names (no real values)

**Acceptance criteria:**
- [ ] `POST /api/auth/sign-up/email` creates user + profile row
- [ ] `POST /api/auth/sign-in/email` returns session cookie
- [ ] `GET /api/auth/get-session` returns session object (INTEGRATION_CONTRACT.md §2 shape)
- [ ] `GET /me/anything` without session → redirect to `/login`
- [ ] `GET /desk/anything` without officer session → 403
- [ ] `GET /api/v1/health` returns `{ data: { ok: true, db: "connected" } }`
- [ ] Status enums in `lib/schemas/` committed and importable

**Outputs for frontends:**
- `lib/auth/client.ts` — import this, never implement your own session logic
- `lib/schemas/` — import status enums from here

---

### P1-SF-01 — UI Foundation, Public Layout, Login/Signup

| Field | Value |
|---|---|
| Phase | 1 |
| Owner | Student Frontend Developer |
| Status | TODO |
| Est | 2h |
| Deps | P1-BE-01 (auth client must be committed; can start layout in parallel) |

**Goal:** Design tokens, global styles, shared UI primitives, public navigation, and login/signup screens wired to Better Auth.

**Owned files:**
- `tailwind.config.ts`
- `app/globals.css`
- `app/layout.tsx`
- `components/ui/**` (install shadcn/ui components as needed)
- `components/public/Navbar.tsx`
- `components/public/Footer.tsx`
- `app/(public)/page.tsx` — homepage shell
- `app/(auth)/login/page.tsx`
- `app/(auth)/signup/page.tsx`
- `app/(member)/me/layout.tsx`
- `docs/progress/student-frontend.md`

**Inputs:** DESIGN_SYSTEM.md (tokens, color palette), INTEGRATION_CONTRACT.md §2 (session shape), `lib/auth/client.ts`
**Outputs:** Working login/signup forms; session-aware navigation; public page shell

**Implementation steps:**
1. Configure Tailwind with design tokens from DESIGN_SYSTEM.md (colors, spacing, typography)
2. Set up Google Fonts in `app/layout.tsx` (Inter or Outfit)
3. Install and configure required shadcn/ui components: Button, Input, Card, Badge, Form, Toast
4. Build `Navbar` — shows login/signup if unauthenticated, user name + logout if authenticated
5. Build `app/(auth)/login/page.tsx` — email/password form → `authClient.signIn.email()`
6. Build `app/(auth)/signup/page.tsx` — name/email/password form → `authClient.signUp.email()`
7. Build `app/(public)/page.tsx` — homepage hero + feature summary (real copy from PRD, no lorem ipsum)
8. Build `app/(member)/me/layout.tsx` — sidebar navigation for student workspace

**Acceptance criteria:**
- [ ] Signup form creates account; success redirects to `/me`
- [ ] Login form authenticates; session-aware nav shows user name
- [ ] Logout clears session; nav returns to unauthenticated state
- [ ] `/me` without session redirects to `/login` (middleware, not frontend guard)
- [ ] Mobile nav works at 360px (no horizontal scroll)
- [ ] Design tokens match DESIGN_SYSTEM.md (colors, fonts confirmed)

---

### P1-MF-01 — Club Desk Layout and Restricted-Route Shell

| Field | Value |
|---|---|
| Phase | 1 |
| Owner | Management Frontend Developer |
| Status | TODO |
| Est | 1.5h |
| Deps | P1-BE-01 (middleware must be committed), P1-SF-01 (UI primitives and Tailwind config) |

**Goal:** Club Desk layout, sidebar navigation, officer-only access enforcement, and honest loading/empty states.

**Owned files:**
- `app/(desk)/desk/layout.tsx`
- `app/(desk)/desk/page.tsx` — dashboard shell
- `components/desk/DeskSidebar.tsx`
- `components/desk/DeskHeader.tsx`
- `components/shared/DataTable.tsx` — reusable admin table
- `components/shared/StatCard.tsx`
- `docs/progress/management-frontend.md`

**Inputs:** DESIGN_SYSTEM.md (desk workspace tokens), INTEGRATION_CONTRACT.md (session shape), P1-BE-01 outputs
**Outputs:** Navigable desk layout; unauthorized access shows access-denied page

**Implementation steps:**
1. Build `DeskSidebar` — links to: Dashboard, Members, Activities, Inventory, Orders, Claims, Finance, Announcements, Handover
2. Build `DeskHeader` — officer name, logout
3. Build `app/(desk)/desk/layout.tsx` — wraps all desk pages; checks session role client-side (display only; real guard is middleware)
4. Build `app/(desk)/desk/page.tsx` — dashboard shell with placeholder StatCards showing loading skeletons
5. Build `DataTable` — sortable, filterable generic table component used across desk pages
6. Build `StatCard` — number + label + trend indicator; used on dashboard and finance

**Acceptance criteria:**
- [ ] `/desk` without officer session → middleware redirects to `/login` (verified, not bypassed in UI)
- [ ] Sidebar navigation renders all links; active link highlighted
- [ ] Dashboard shows skeleton loading states (not fake numbers)
- [ ] `DataTable` renders with columns, rows, and empty state
- [ ] Layout is consistent across 1280px and 768px viewports

**Phase 1 Gate (ALL FOUR must pass):**
- [ ] `npm run dev` starts without errors on all four machines
- [ ] `GET /api/v1/health` returns connected DB
- [ ] Signup → session cookie → authenticated nav
- [ ] Login → redirect to /me
- [ ] Logout → unauthenticated nav
- [ ] `/desk` without officer session → redirected
- [ ] Design tokens visible in browser

---

## PHASE 2 — Membership, Ticketing, and Money
**Target: Hours 4–10**
**Gate: Join → confirm dues → buy member ticket → scan once → reject duplicate → financial entries verified.**

---

### P2-DB-01 — Booking, Payment, and Financial Tables

| Field | Value |
|---|---|
| Phase | 2 |
| Owner | DB Developer |
| Status | TODO |
| Est | 1.5h |
| Deps | P1-DB-01 (DONE), Phase 1 gate passed |

**Goal:** Complete schema for activities, bookings, tickets, purchases, payment attempts, cashbook, idempotency.

**Owned files:**
- `prisma/schema.prisma` (additions)
- `prisma/migrations/` (migration 002 and 003)

**New models:** Activity, ActivityStaff, Booking, Ticket, Purchase, PaymentAttempt, PaymentEvent, CashbookEntry, FundraiserReceipt, IdempotencyRecord

**Acceptance criteria:**
- [ ] Migration runs cleanly on fresh DB
- [ ] `capacity` constraint: cannot insert booking if `SELECT count(*) >= activity.capacity` (enforced in service with row lock; DB has no-negative constraint)
- [ ] `Booking.expiresAt` index exists (for expiry cleanup job)
- [ ] `PaymentEvent.eventId` has unique constraint (prevents replay)
- [ ] `CashbookEntry.amountPaise` has CHECK constraint (> 0)
- [ ] `IdempotencyRecord` unique constraint on (actorId, operation, key)

---

### P2-BE-01 — Membership, Payment, and Ticket Services

| Field | Value |
|---|---|
| Phase | 2 |
| Owner | Backend Developer |
| Status | TODO |
| Est | 3h |
| Deps | P2-DB-01 (schema applied) |

**Goal:** Complete membership activation, demo payment, ticket reservation, QR check-in, and cashbook recording.

**Owned files:**
- `lib/services/MembershipService.ts`
- `lib/services/BookingService.ts`
- `lib/services/CheckInService.ts`
- `lib/services/CashbookService.ts`
- `lib/providers/PaymentAdapter.ts` (interface + demo impl)
- `lib/providers/DemoPaymentAdapter.ts`
- `app/api/v1/memberships/route.ts`
- `app/api/v1/memberships/[id]/confirm/route.ts`
- `app/api/v1/activities/route.ts`
- `app/api/v1/activities/[id]/route.ts`
- `app/api/v1/bookings/route.ts`
- `app/api/v1/bookings/[id]/confirm/route.ts`
- `app/api/v1/tickets/me/route.ts`
- `app/api/v1/tickets/[id]/checkin/route.ts`
- `app/api/v1/payments/demo-confirm/route.ts`
- `app/api/v1/finance/summary/route.ts`
- `tests/integration/services/MembershipService.test.ts`
- `tests/integration/services/BookingService.test.ts`

**Acceptance criteria:**
- [ ] Membership activates on confirmed payment; idempotent on duplicate confirmation
- [ ] Member-price ticket correctly cheaper than public price
- [ ] 10 concurrent reservation requests for 1 seat: exactly 1 succeeds
- [ ] Duplicate payment event does not create duplicate ticket or cashbook entry
- [ ] QR check-in succeeds once; second attempt returns `DENIED / ALREADY_USED`
- [ ] Check-in with wrong activity token returns `DENIED / WRONG_ACTIVITY`
- [ ] Demo-confirm endpoint returns 404 when `PAYMENT_MODE !== "demo"`
- [ ] Finance summary returns correct INFLOW total after confirmed payments

---

### P2-SF-01 — Membership Flow, Events, and Ticket Presentation

| Field | Value |
|---|---|
| Phase | 2 |
| Owner | Student Frontend Developer |
| Status | TODO |
| Est | 2.5h |
| Deps | P2-BE-01 (endpoints live), P1-SF-01 (DONE) |

**Goal:** Student can join, renew membership, browse events, buy a ticket, and see their QR pass.

**Owned files:**
- `app/(member)/me/membership/page.tsx`
- `app/(public)/events/page.tsx`
- `app/(public)/events/[id]/page.tsx`
- `app/(member)/me/passes/page.tsx`
- `components/student/MembershipCard.tsx`
- `components/student/EventCard.tsx`
- `components/student/TicketQR.tsx`
- `components/student/BookingFlow.tsx`

**Acceptance criteria:**
- [ ] `/me/membership` shows active membership card with expiry date (real API data)
- [ ] Non-member sees join CTA; member sees renewal-available state
- [ ] Event listing shows member vs public price from API
- [ ] Booking flow: select event → demo pay → ticket appears in `/me/passes`
- [ ] QR code renders from `encryptedToken` (INTEGRATION_CONTRACT.md §5)
- [ ] Payment confirmation state shows "SIMULATED PAYMENT" label
- [ ] Empty states: no events, no passes — with clear copy

---

### P2-MF-01 — Member Directory, Activity Management, Scanner

| Field | Value |
|---|---|
| Phase | 2 |
| Owner | Management Frontend Developer |
| Status | TODO |
| Est | 2.5h |
| Deps | P2-BE-01 (endpoints live), P1-MF-01 (DONE) |

**Goal:** Officer can see members, create activities, view bookings, and scan QR codes.

**Owned files:**
- `app/(desk)/desk/members/page.tsx`
- `app/(desk)/desk/activities/page.tsx`
- `app/(desk)/desk/activities/new/page.tsx`
- `app/(desk)/desk/activities/[id]/page.tsx`
- `app/(desk)/desk/activities/[id]/scanner/page.tsx`
- `components/desk/ActivityForm.tsx`
- `components/desk/AttendanceTable.tsx`
- `components/desk/QRScanner.tsx`
- `components/desk/ManualCheckin.tsx`

**Acceptance criteria:**
- [ ] Member directory: lists users with membership status (real API)
- [ ] Activity creation form saves and shows in activity list
- [ ] Booking/attendance view shows confirmed tickets
- [ ] QR scanner: camera reads token → shows ACCEPTED / DENIED result
- [ ] Manual entry: staff enters token string manually (fallback for camera issues)
- [ ] Dashboard StatCards now show real membership count and ticket count

**Phase 2 Gate (ALL FOUR must pass):**
- [ ] Student joins: membership active, dues recorded in cashbook
- [ ] Student buys member-price ticket: cheaper than public price confirmed
- [ ] Ticket QR displayed in /me/passes
- [ ] Officer scans: ACCEPTED response
- [ ] Re-scan same ticket: DENIED / ALREADY_USED
- [ ] Finance summary INFLOW total matches sum of confirmed payments

---

## PHASE 3 — Complete Club Operations
**Target: Hours 10–18**
**Gate: Merch stock accurate, claims separate approval from payout, tasks work, announcements persist, finance reconciles.**

---

### P3-DB-01 — Merch, Orders, Tasks, Claims, and Announcement Tables

| Field | Value |
|---|---|
| Phase | 3 |
| Owner | DB Developer |
| Status | TODO |
| Est | 1.5h |
| Deps | P2-DB-01 (DONE) |

**New models:** Product, Variant, Order, OrderItem, Task, Claim, ClaimReceipt, Announcement, EmailJob, AuditEvent (extended)

**Acceptance criteria:**
- [ ] `Variant.stockReserved + stockSold <= stockTotal` CHECK constraint (or enforced via service with lock)
- [ ] `Claim.reviewerId != Claim.claimantId` CHECK constraint
- [ ] `CashbookEntry` for claim OUTFLOW only has payout ref (not approval)
- [ ] Announcement + EmailJob relationship: publish creates email job rows

---

### P3-BE-01 — Merchandise, Claims, Tasks, Announcements, and Jobs

| Field | Value |
|---|---|
| Phase | 3 |
| Owner | Backend Developer |
| Status | TODO |
| Est | 3.5h |
| Deps | P3-DB-01 (schema applied) |

**Owned services + routes:** MerchandiseService, OrderService, ClaimService, TaskService, AnnouncementService, EmailJobRunner, ReservationExpiryJob, ReceiptUploadHandler

**Key acceptance criteria:**
- [ ] Last size-level item: concurrent orders — exactly 1 succeeds
- [ ] Order confirmation is idempotent (duplicate webhook does not double-decrement stock)
- [ ] Claim approval: status changes, no cashbook entry written
- [ ] Claim payout: cashbook OUTFLOW written; claimant ≠ reviewer ≠ payer enforced
- [ ] Self-approval: 403 with SELF_APPROVAL_FORBIDDEN
- [ ] Receipt upload: magic byte validated; file stored outside public/
- [ ] Receipt download: owner and treasurer only; streams file, never exposes path
- [ ] Announcements: draft → publish → email jobs enqueued
- [ ] Reservation expiry job: marks expired bookings/orders without touching confirmed records

---

### P3-SF-01 — Shop, Orders, Tasks, Claims, and Announcements (Student)

| Field | Value |
|---|---|
| Phase | 3 |
| Owner | Student Frontend Developer |
| Status | TODO |
| Est | 2.5h |
| Deps | P3-BE-01 (endpoints live) |

**Owned pages:** `/merch`, `/merch/[id]`, `/me/orders`, `/me/contributions` (tasks + claims), `/me/updates`

**Key acceptance criteria:**
- [ ] Variant selector shows live stock counts; sold-out variants disabled
- [ ] Checkout → demo pay → order appears in `/me/orders` with status
- [ ] Claim submission: form + receipt upload (file picker → multipart POST)
- [ ] Own claim status updates visible without page refresh (polling or revalidation)
- [ ] Announcement feed shows published announcements (real API)
- [ ] Error states for all flows (API errors shown, not silently swallowed)

---

### P3-MF-01 — Inventory, Order Fulfilment, Claims Review, Tasks, Full Finance

| Field | Value |
|---|---|
| Phase | 3 |
| Owner | Management Frontend Developer |
| Status | TODO |
| Est | 3h |
| Deps | P3-BE-01 (endpoints live) |

**Owned pages:** `/desk/inventory`, `/desk/orders`, `/desk/claims`, `/desk/tasks`, `/desk/finance`, `/desk/announcements`, Activity Hub tabs

**Key acceptance criteria:**
- [ ] Inventory: per-variant stock counts from real API; officer adjusts stock total
- [ ] Order list: filter by status; mark collected button triggers fulfil endpoint
- [ ] Claims: approve/reject/payout actions; self-approval button disabled for own claims
- [ ] Finance page: summary totals + cashbook entry list; EvidenceDrawer (total → source records)
- [ ] Activity Hub: four tabs — Tickets, Team, Money, Results — all for same activityId
- [ ] Announcement composer: draft → publish; preview before publish

**Phase 3 Gate (ALL FOUR must pass):**
- [ ] Merchandise purchase decrements correct variant stockSold
- [ ] Officer marks order fulfilled; student sees "Collected" status
- [ ] Claim approval: status → approved; balance unchanged
- [ ] Claim payout: cashbook OUTFLOW entry; balance decremented
- [ ] Self-approval attempt: disabled in UI and rejected by API (403)
- [ ] Finance summary totals match sum of individual cashbook entries

---

## PHASE 4 — Differentiation, Hardening, and Demo
**Target: Hours 18–24**
**Gate: Core tests pass, finance reconciles, permissions verified, demo rehearsed.**

---

### P4-DB-01 — Demo Seed, Reconciliation, and Snapshot Support

| Field | Value |
|---|---|
| Phase | 4 |
| Owner | DB Developer |
| Status | TODO |
| Est | 1h |
| Deps | P3-DB-01 (DONE) |

**Goal:** Demo seed creates a realistic pre-populated scenario; snapshot schema finalized; concurrency stress checks run.

**Acceptance criteria:**
- [ ] `npm run db:seed` on fresh DB produces: 2 activities (1 past, 1 upcoming), 5 members, 3 merch orders, 2 claims (1 approved, 1 paid), realistic cashbook
- [ ] `HandoverSnapshot` model added with frozen `snapshotJson` field
- [ ] Concurrency test: 20 concurrent booking attempts for 5-seat event → exactly 5 succeed
- [ ] No float in any financial seed value

---

### P4-BE-01 — Hardening, Snapshot, Finance Drill-Down, and Security Verification

| Field | Value |
|---|---|
| Phase | 4 |
| Owner | Backend Developer |
| Status | TODO |
| Est | 2h |
| Deps | P3-BE-01 (DONE), P4-DB-01 |

**Goal:** Snapshot generation, finance entries drill-down, idempotency review, security header verification, integration test suite.

**Owned:** `SnapshotService`, `/api/v1/snapshots`, `/api/v1/finance/entries`, all integration tests

**Acceptance criteria:**
- [ ] Snapshot generated; subsequent financial transactions do not change frozen JSON
- [ ] Finance entries paginated; cursor stable across pages
- [ ] All integration tests for AT04, AT05, AT08, AT10, AT13, AT14, AT15, AT20 pass against skyline_test
- [ ] Security headers present in all responses (X-Frame-Options, X-Content-Type-Options, etc.)
- [ ] Demo-confirm endpoint returns 404 with `PAYMENT_MODE=live`
- [ ] No server secret appears in any response body or client bundle

---

### P4-SF-01 — Mobile Polish, Error States, and E2E Integration

| Field | Value |
|---|---|
| Phase | 4 |
| Owner | Student Frontend Developer |
| Status | TODO |
| Est | 1.5h |
| Deps | P3-SF-01 (DONE) |

**Goal:** All student flows work end-to-end with real API; mobile tested; error states complete.

**Acceptance criteria:**
- [ ] All P0 student flows work at 360px without horizontal scroll
- [ ] Every API call has: loading state, success state, and real error state
- [ ] No mock data in any student page (USE_MOCK_DATA flag removed or set false)
- [ ] E2E test: signup → membership → event booking → QR pass → (staff scans) → confirmed
- [ ] Accessibility: all form inputs have labels; keyboard navigation works on login/signup

---

### P4-MF-01 — Committee Time Capsule, Activity Hub Final, Demo Views

| Field | Value |
|---|---|
| Phase | 4 |
| Owner | Management Frontend Developer |
| Status | TODO |
| Est | 1.5h |
| Deps | P3-MF-01 (DONE), P4-BE-01 (snapshot endpoint live) |

**Goal:** Committee Time Capsule implemented; Activity Hub complete; Club health alerts if time permits.

**Acceptance criteria:**
- [ ] Time Capsule: officer generates snapshot; page displays frozen financial summary
- [ ] Snapshot list shows all historical snapshots; selecting one shows that snapshot's data (not live data)
- [ ] Activity Hub: all four tabs working with real API data
- [ ] Dashboard StatCards show real current counts
- [ ] Club health alerts (if time): expiring memberships, unpaid approved claims, low stock (cut if P0 not stable)

**Phase 4 Gate — Final Demo Readiness:**
- [ ] Core acceptance tests pass (AT04, AT05, AT08, AT13, AT14, AT20)
- [ ] Financial totals reconcile: sum of cashbook entries matches summary totals
- [ ] Self-approval and self-payout blocked at API level (403 confirmed)
- [ ] Receipt files private (direct URL returns 404)
- [ ] Demo seed produces coherent realistic scenario
- [ ] No known money duplication, oversell, or authorization bypass
- [ ] README setup instructions produce working local app in < 10 minutes
- [ ] Demo rehearsal completed; limitations documented honestly

---

## Scope Cut Rules

| Trigger | Cut |
|---|---|
| No working membership slice by hour 6 | Stop visual polish; integrate immediately |
| Core sales/claims incomplete by hour 17 | Cut Time Capsule and health alerts; keep basic finance |
| Any known money duplication bug | Stop all new features; fix immediately |
| Test environment broken | Disclose; use manual smoke; never claim automated coverage |

**Never cut:** Server pricing, role enforcement, duplicate-payment protection, approval/payout separation.

---

## Parallel Work — Phase Assignments

| Developer | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---|---|---|---|---|
| DB | P1-DB-01 | P2-DB-01 | P3-DB-01 | P4-DB-01 |
| BE | P1-BE-01 | P2-BE-01 | P3-BE-01 | P4-BE-01 |
| SF | P1-SF-01 | P2-SF-01 | P3-SF-01 | P4-SF-01 |
| MF | P1-MF-01 | P2-MF-01 | P3-MF-01 | P4-MF-01 |

Within each phase, DB and BE work first. SF and MF can begin with mock data once schemas and contracts are published, but must integrate with real endpoints before the phase gate.
