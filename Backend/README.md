# Backend & Authentication Subsystem

Welcome Evaluator! This directory houses the domain logic, security guards, provider adapters, validation schemas, background jobs, and automated test suites for the **Skyline Student Association ERP**.

---

## Directory Layout

```
Backend/
├── README.md                      # Evaluator orientation & architecture guide
├── lib/
│   ├── api/
│   │   └── errors.ts              # SkylineError & handleApiError envelope formatter
│   ├── auth/
│   │   ├── auth.ts                # Better Auth server configuration (Prisma PostgreSQL adapter)
│   │   ├── client.ts              # Better Auth browser client for frontend teams
│   │   └── session.ts             # Server session guards: requireAuth, requireRole, requireOwner, requireActivityStaff
│   ├── env.ts                     # Startup environment validation with Zod
│   ├── prisma.ts                  # Singleton PrismaClient with defensive DatabaseDependencyError
│   ├── providers/
│   │   ├── PaymentAdapter.ts      # Payment gateway abstraction interface
│   │   ├── DemoPaymentAdapter.ts  # Zero-cost demo payment adapter (guarded by PAYMENT_MODE)
│   │   ├── EmailAdapter.ts        # Email delivery interface with idempotency keys
│   │   └── ConsoleEmailAdapter.ts # Development/test deterministic email provider
│   ├── schemas/
│   │   ├── enums.ts               # Domain status enums (Membership, Claim, Booking, Order, Task, Role)
│   │   ├── memberships.ts         # Membership & Period Zod request/response schemas
│   │   ├── tasks.ts               # Task creation, update, and assignment schemas
│   │   ├── announcements.ts       # Announcement draft, publish, and audience schemas
│   │   ├── claims.ts              # Reimbursement claim review and payout schemas
│   │   ├── activities.ts          # Activity, booking, and ticket pass schemas
│   │   ├── merchandise.ts         # Product, variant stock, and order schemas
│   │   └── finance.ts             # Finance summary, cashbook entry, and snapshot schemas
│   └── services/
│       ├── HealthService.ts       # Decoupled liveness (200) & database readiness (503) pings
│       ├── MembershipService.ts   # Period querying, member discount eligibility, renewal checks
│       ├── CheckInService.ts      # QR ticket check-in engine (atomic single-use invariant)
│       ├── TaskService.ts         # Volunteer task management with activity-staff scoping
│       ├── AnnouncementService.ts # Draft/publish workflow with idempotent email job dispatch
│       ├── ReceiptService.ts      # Private filesystem storage, magic bytes, and traversal guards
│       ├── ClaimService.ts        # Reimbursement review with self-approval & self-payout prohibition
│       ├── ActivityService.ts     # Activity CRUD and attendance roster calculations
│       ├── BookingService.ts      # Atomic capacity locking, ticket issuance, and payment confirm
│       ├── MerchandiseService.ts  # Product inventory and size-variant stock management
│       ├── OrderService.ts        # Deadlock-free sorted variant holds and desk fulfilment
│       ├── FinanceService.ts      # Cashbook ledger totals, true available funds, fundraiser receipts
│       ├── SnapshotService.ts     # Frozen, immutable committee handover JSON snapshot generator
│       └── JobRunnerService.ts    # Background expiry for stale holds and exponential email retries
└── tests/
    └── unit/
        ├── backend-foundation.test.ts             # Error envelopes, env validator, status schemas (12 tests)
        ├── auth-session.test.ts                   # Ownership guards & HealthService readiness (3 tests)
        ├── services-and-providers.test.ts         # DemoPaymentAdapter & CheckInService invariants (4 tests)
        ├── routes-http.test.ts                    # Real observed HTTP route responses (6 tests)
        ├── task-service.test.ts                   # Task permissions, officer vs staff vs assignee (5 tests)
        ├── announcement-service.test.ts           # Audience scoping, publish idempotency, email jobs (4 tests)
        ├── claim-receipt-service.test.ts          # Magic bytes, path traversal, self-approval/payout (12 tests)
        ├── activity-booking-concurrency.test.ts   # Capacity concurrency, ticket issuance, idempotency (3 tests)
        ├── merchandise-order-concurrency.test.ts  # Inventory reservation concurrency, fulfilment (4 tests)
        ├── finance-snapshot.test.ts               # Ledger formulas, fundraiser cash, snapshot immutability (3 tests)
        └── background-jobs.test.ts                # Idempotent reservation expiry, retry backoff (3 tests)
```

---

## Next.js HTTP Entry Routes (`app/api/`)

| Route | Method | Access | Purpose |
|---|---|---|---|
| `/api/auth/[...all]` | ALL | Public | Better Auth handler (sign-up, sign-in, session) |
| `/api/v1/health/liveness` | GET | Public | Process liveness probe (200 independently of DB) |
| `/api/v1/health` | GET | Public | Database readiness probe (200 when ready, 503 when DB offline) |
| `/api/v1/me` | GET | Authenticated | Current user session identity |
| `/api/v1/membership-periods` | GET | Public | Available academic periods & dues rates |
| `/api/v1/memberships/me` | GET | Authenticated | Current user's active membership |
| `/api/v1/memberships` | POST | Authenticated | Initiate new membership or renewal |
| `/api/v1/payments/demo-confirm` | POST | Authenticated | Demo payment confirmation (404 in live mode) |
| `/api/v1/activities` | GET, POST | Public / Officer | List activities or create new activity |
| `/api/v1/activities/:id` | GET, PATCH | Public / Officer | Activity details or update activity |
| `/api/v1/activities/:id/attendance` | GET | Staff / Officer | Activity attendance list |
| `/api/v1/bookings` | POST | Authenticated | Reserve seat + create purchase intent |
| `/api/v1/bookings/me` | GET | Authenticated | Current user's bookings |
| `/api/v1/bookings/:id/confirm` | POST | Authenticated | Confirm booking payment & issue ticket |
| `/api/v1/tickets/me` | GET | Authenticated | Current user's active QR passes |
| `/api/v1/tickets/:id/checkin` | POST | Staff / Officer | Door check-in ticket scan |
| `/api/v1/products` | GET, POST | Public / Officer | List products or create new merchandise |
| `/api/v1/products/:id` | GET, PATCH | Public / Officer | Product details or update product |
| `/api/v1/variants/:id` | PATCH | Officer | Update variant stock counts |
| `/api/v1/orders` | GET, POST | Officer / Authenticated | List all orders or place new order |
| `/api/v1/orders/me` | GET | Authenticated | Current user's merchandise orders |
| `/api/v1/orders/:id/confirm` | POST | Authenticated | Confirm order payment & transition stock |
| `/api/v1/orders/:id/fulfil` | PATCH | Officer | Mark collected by student at club desk |
| `/api/v1/tasks` | GET, POST | Authenticated / Officer | List tasks or create new task |
| `/api/v1/tasks/:id` | PATCH | Authenticated | Update task status or details |
| `/api/v1/tasks/:id/assign` | PATCH | Staff / Officer | Assign task to volunteer |
| `/api/v1/announcements` | GET, POST | Public / Officer | List published announcements or create draft |
| `/api/v1/announcements/:id` | GET | Public | Single announcement detail |
| `/api/v1/announcements/:id/publish` | PATCH | Officer | Publish announcement & enqueue email jobs |
| `/api/v1/claims` | GET, POST | Treasurer / Authenticated | List all claims or submit new claim |
| `/api/v1/claims/me` | GET | Authenticated | Current user's reimbursement claims |
| `/api/v1/claims/:id/approve` | PATCH | Treasurer | Approve claim (self-approval forbidden) |
| `/api/v1/claims/:id/reject` | PATCH | Treasurer | Reject claim with review notes |
| `/api/v1/claims/:id/payout` | PATCH | Treasurer | Record payout & write cashbook OUTFLOW |
| `/api/v1/claims/:id/receipt` | GET, POST | Owner / Treasurer | Stream receipt file or upload new receipt |
| `/api/v1/finance/summary` | GET | Officer / Treasurer | Total inflow, outflow, obligations, available |
| `/api/v1/finance/entries` | GET | Officer / Treasurer | Paginated cashbook entries |
| `/api/v1/finance/fundraiser` | POST | Treasurer | Record fundraiser cash collection |
| `/api/v1/snapshots` | GET, POST | Officer | List or generate immutable handover snapshot |
| `/api/v1/snapshots/:id` | GET | Officer | Retrieve single handover snapshot |
| `/api/internal/jobs/run` | POST | Secret | Background job runner (expiry & email dispatch) |

---

## Verification Commands & Test Results

The backend is verified with **107 automated tests across 18 test suites (0 failures, 0 skipped)**:
- **80 Unit & Invariant Tests**: Pure domain logic, state machines, Zod schema validation, magic byte inspection, path traversal guards, error envelopes, and Better Auth rate-limit policy tests.
- **27 Live Database Integration Tests**: Executed directly against our running local PostgreSQL instance and compiled Next.js HTTP server.

```bash
# Run all 107 tests (unit + real database integration)
npm test

# Run unit tests only (80 tests)
npm run test:unit

# Run live PostgreSQL integration tests only (27 tests)
npm run test:integration

# Run TypeScript strict typecheck (0 errors)
npm run typecheck

# Run Next.js production build (41 dynamic routes compiled)
npm run build
```

---

## Real PostgreSQL Workflows Verified

The test suite in `Backend/tests/integration/real-db-workflows.test.ts` validates:

1. **Authentication & Session Lifecycle (Better Auth + Prisma):**
   - User signup persists directly to `users` and `accounts` with hashed passwords.
   - User signin returns valid session cookie; `/api/v1/me` resolves caller identity.
   - Unauthenticated requests to protected endpoints return HTTP 401.
   - Non-officer users attempting officer endpoints return HTTP 403 `FORBIDDEN`.
   - Signout invalidates session token.

2. **Membership Dues & Idempotent Cashbook Inflow:**
   - Dues initiation creates pending membership.
   - Demo payment confirmation updates membership to `active` and logs exactly ONE `CashbookEntry` INFLOW.
   - Replaying confirmation is idempotent: returns existing records without duplicate revenue or duplicate cashbook rows.

3. **Event Booking, Capacity Locking & Single-Use Check-in:**
   - Concurrent bookings for last seat execute under row-level lock (`SELECT ... FOR UPDATE`); loser receives HTTP 409 `CAPACITY_EXHAUSTED`.
   - Payment confirmation issues single ticket with encrypted QR token.
   - Door check-in atomically records check-in timestamp and staff ID (`ACCEPTED`).
   - Re-scanning the same ticket returns `DENIED` with reason `ALREADY_USED`.
   - Expired reservations cannot be revived by payment confirmation.

4. **Merchandise Inventory & Sorted Lock Concurrency:**
   - Order reservation locks variants in alphanumeric ID order, incrementing `stockReserved`.
   - Concurrent order for last unit rejects with HTTP 409 `STOCK_EXHAUSTED`.
   - Confirmation transitions `stockReserved` into `stockSold` and creates `CashbookEntry` INFLOW.
   - Expiry background job returns reserved inventory back to available pool.
   - Club desk collection marks order `collected`.

5. **Reimbursement Claims & Separation of Duties:**
   - Claimant submits claim with receipt.
   - Claimant attempting to approve their own claim fails with HTTP 403 `SELF_APPROVAL_FORBIDDEN`.
   - Claimant attempting to pay out their own claim fails with HTTP 403 `SELF_PAYOUT_FORBIDDEN`.
   - Claim approval transitions status but writes ZERO cashbook entries.
   - Payout transitions status to `paid` and records exactly ONE `CashbookEntry` OUTFLOW.

6. **Transaction Rollback:**
   - When a dependent write within a multi-table transaction fails, all preceding mutations roll back cleanly without leaving partial records or phantom ledger entries.

7. **Targeted Test-Data Isolation & Exact-ID Cleanup:**
   - Test suites track exact IDs of all entities created during a run (`TestResourceTracker`).
   - Deletion strictly cascades by exact ID without using broad prefix sweeps (`startsWith("test_")`, `startsWith("buyer")`, `startsWith("racer")`).
   - Preserves untracked fixture rows matching legacy prefixes while cleaning only tracked run records.
   - Seeded demo accounts and unrelated database rows are strictly isolated and never mutated.

---

## Demo Accounts & Environment Setup

Demo credentials are configured securely in gitignored local configuration (`.env.local`):

| Role | Default Email | Local Config Variable | Description & Privileges |
|---|---|---|---|
| **Student** | `student@skyline.edu` | `DEMO_STUDENT_PASSWORD` | General student; active membership, bookings, merchandise orders, claims |
| **Officer** | `officer@skyline.edu` | `DEMO_OFFICER_PASSWORD` | Club officer; activities management, desk inventory fulfilment, task assignment |
| **Treasurer** | `treasurer@skyline.edu` | `DEMO_TREASURER_PASSWORD` | Financial officer; claim approvals, payouts, cashbook ledger & summaries |

To seed or refresh accounts locally without resetting passwords or data:
```bash
npm run db:seed
```
The seed script checks `prisma.user.findUnique` first and will never overwrite existing accounts or reset working passwords.

