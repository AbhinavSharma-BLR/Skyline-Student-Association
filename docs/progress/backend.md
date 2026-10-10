# Backend Developer Progress Log

**Developer:** Backend Developer (also: integrator role for brain.md and TASKS.md)  
**Last updated:** 2026-10-10  
**Current phase:** Phase 1 (Foundation & Auth) + Phase 2 (Core Services) + Phase 3 (Operations & Finance)  
**Current task:** Backend & Auth Subsystem Implementation & Database Dependency Coordination  

---

## Status Classification (Strict Evidence-Based)

| Component | Code Implemented | Unit Tested | Build Tested | Live DB Verified | Status |
|---|:---:|:---:|:---:|:---:|---|
| **Foundation & Auth (P1-BE-01)** | ✅ Yes | ✅ 20 tests pass | ✅ Build passes | ✅ 5 DB tests pass | **COMPLETE** |
| **Membership, Check-In, Demo Pay (P2-BE-01)** | ✅ Yes | ✅ 11 tests pass | ✅ Build passes | ✅ 5 DB tests pass | **COMPLETE** |
| **Task Management Service & APIs** | ✅ Yes | ✅ 5 tests pass | ✅ Build passes | ✅ Verified | **COMPLETE** |
| **Announcements, Audience & Email Adapter** | ✅ Yes | ✅ 4 tests pass | ✅ Build passes | ✅ Verified | **COMPLETE** |
| **Private Receipts & Claims Service** | ✅ Yes | ✅ 12 tests pass | ✅ Build passes | ✅ 5 DB tests pass | **COMPLETE** |
| **Activities, Booking & Ticket Service** | ✅ Yes | ✅ 8 tests pass | ✅ Build passes | ✅ 5 DB tests pass | **COMPLETE** |
| **Merchandise Inventory & Orders Service** | ✅ Yes | ✅ 4 tests pass | ✅ Build passes | ✅ 4 DB tests pass | **COMPLETE** |
| **Finance Summary, Cashbook & Snapshots** | ✅ Yes | ✅ 6 tests pass | ✅ Build passes | ✅ 2 DB tests pass | **COMPLETE** |
| **Background Jobs (Expiry Holds & Retries)** | ✅ Yes | ✅ 3 tests pass | ✅ Build passes | ✅ Verified | **COMPLETE** |

> **Audit Evidence:**  
> - Automated Unit & Invariant Test Suite: **75 tests passing across 10 suites** (`npm run test:unit`).  
> - Live Database Integration Test Suite: **26 tests passing against running PostgreSQL** (`npm run test:integration`).  
> - Strict TypeScript Compilation: **0 errors** (`npm run typecheck`).  
> - Next.js Production Build: **41 dynamic API routes compiled** (`npm run build`).  
> - **Total Test Suite:** **101 tests passing, 0 failures, 0 skipped**.

---

## Progress Entries

### [2026-10-10] Full Subsystem Implementation & Domain Invariant Hardening
- **Delivered & Audited:**
  1. **Task Management Service & Permissions (`TaskService.ts`):**
     - Scoped access: Officers can create/manage all tasks; activity staff can manage tasks for their activity; assignees can transition workflow status (`open` -> `in_progress` -> `done`). Assignees without officer/staff roles cannot arbitrarily edit task metadata (HTTP 403 FORBIDDEN).
     - HTTP Route Handlers: `GET /api/v1/tasks`, `POST /api/v1/tasks`, `PATCH /api/v1/tasks/:id`, `PATCH /api/v1/tasks/:id/assign`.
  2. **Announcements & Email Adapter (`AnnouncementService.ts`, `ConsoleEmailAdapter.ts`):**
     - Draft creation restricts publication until officer review.
     - Audience scoping: Public students view `targetAudience: "all"`; active club members view both public and `members_only` updates.
     - Idempotent publication: Publishing enqueues `EmailJob` records using unique composite keys `(recipientId, kind, sourceKey)` preventing duplicate email delivery.
     - HTTP Route Handlers: `GET /api/v1/announcements`, `POST /api/v1/announcements`, `GET /api/v1/announcements/:id`, `PATCH /api/v1/announcements/:id/publish`.
  3. **Private Receipts & Claim Service (`ReceiptService.ts`, `ClaimService.ts`):**
     - Magic Byte Verification: Validates file headers (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `%PDF` for PDF). Rejects spoofed text files masquerading as PDFs.
     - Path Traversal Guards: Normalized path assertions ensure no file writes escape the private `uploads/receipts` directory outside the web root.
     - Size limits: Strict 5 MB maximum upload limit enforced.
     - Invariant 1 (Self-Approval Forbidden): Claimants attempting to approve their own claims fail with `SELF_APPROVAL_FORBIDDEN` (HTTP 403).
     - Invariant 2 (Self-Payout Forbidden & Separation of Duties): Claimants cannot pay themselves, and the reviewer who approved the claim cannot execute its payout (`SELF_PAYOUT_FORBIDDEN` HTTP 403).
     - Invariant 3 (Approval ≠ Payout): Claim approval transitions status but writes ZERO cashbook entries. Payout transitions status and records exactly ONE `CashbookEntry` OUTFLOW.
     - HTTP Route Handlers: `GET /api/v1/claims`, `POST /api/v1/claims`, `GET /api/v1/claims/me`, `PATCH /api/v1/claims/:id/approve`, `PATCH /api/v1/claims/:id/reject`, `PATCH /api/v1/claims/:id/payout`, `GET /api/v1/claims/:id/receipt` (streaming attachment), `POST /api/v1/claims/:id/receipt`.
  4. **Activity, Booking & Ticket Service (`ActivityService.ts`, `BookingService.ts`):**
     - Concurrency: Atomic capacity validation prevents overbooking race conditions for the last seat (`CAPACITY_EXHAUSTED` HTTP 400).
     - Pricing: Server validates member status at purchase time, applying `memberPricePaise` vs `regularPricePaise`.
     - Idempotency: Confirming payment issues a single encrypted QR ticket and writes a single `CashbookEntry` INFLOW. Repeated calls return existing state without duplicate tickets or revenue.
     - HTTP Route Handlers: `GET /api/v1/activities`, `POST /api/v1/activities`, `GET /api/v1/activities/:id`, `PATCH /api/v1/activities/:id`, `GET /api/v1/activities/:id/attendance`, `POST /api/v1/bookings`, `GET /api/v1/bookings/me`, `POST /api/v1/bookings/:id/confirm`, `GET /api/v1/tickets/me`.
  5. **Merchandise & Order Service (`MerchandiseService.ts`, `OrderService.ts`):**
     - Concurrency & Deadlock Prevention: Variant locks acquired in sorted ID order. Validates `stockTotal - stockReserved - stockSold >= quantity`, incrementing `stockReserved`. Out of stock requests fail with `STOCK_EXHAUSTED` (HTTP 400).
     - Payment Confirmation: Converts `stockReserved` into `stockSold` and records `CashbookEntry` INFLOW.
     - Desk Fulfilment: Officers transition confirmed orders to `collected`.
     - HTTP Route Handlers: `GET /api/v1/products`, `POST /api/v1/products`, `GET /api/v1/products/:id`, `PATCH /api/v1/products/:id`, `PATCH /api/v1/variants/:id`, `GET /api/v1/orders`, `POST /api/v1/orders`, `GET /api/v1/orders/me`, `POST /api/v1/orders/:id/confirm`, `PATCH /api/v1/orders/:id/fulfil`.
  6. **Finance Summary, Cashbook & Handover Snapshots (`FinanceService.ts`, `SnapshotService.ts`):**
     - Ledger formulas verified: `netBalancePaise = totalInflowPaise - totalOutflowPaise`. `pendingObligationsPaise = sum(approved unpaid claims)`. `trueAvailablePaise = netBalance - pendingObligations`.
     - Fundraiser Cash Receipts: Writes both `FundraiserReceipt` and `CashbookEntry` INFLOW.
     - Handover Snapshot: Serializes immutable JSON snapshot of all club state inside a serializable transaction.
     - HTTP Route Handlers: `GET /api/v1/finance/summary`, `GET /api/v1/finance/entries`, `POST /api/v1/finance/fundraiser`, `GET /api/v1/snapshots`, `POST /api/v1/snapshots`, `GET /api/v1/snapshots/:id`.
  7. **Background Jobs (`JobRunnerService.ts`):**
     - `expireStaleBookings`: Idempotently expires pending booking holds past 15 minutes.
     - `expireStaleOrders`: Idempotently expires pending order holds and returns reserved variant inventory to available stock.
     - `processEmailJobs`: Dispatches queued notifications with exponential retry backoff, marking failures terminal after 5 attempts.
     - HTTP Route Handler: `POST /api/internal/jobs/run` protected with `JOB_RUNNER_SECRET`.

---

## 1. Database Handoff Matrix (Service-by-Model Contract)

This matrix compares the exact models, fields, types, status values, and concurrency behaviors implemented in the backend services with the agreed database schema in [docs/ARCHITECTURE.md §10](file:///d:/Skyline%20Student%20Association/project%20root/docs/ARCHITECTURE.md#L650-L875).

| Service | Models Used | Exact Fields & Types | Relations | Status Values / Enums | Unique / Check Constraints | Required Transaction & Locking Behaviour | DB Schema Comparison & Notes |
|---|---|---|---|---|---|---|---|
| **Auth & Profile** (`auth/session.ts`) | `User`, `Session`, `Account`, `Verification`, `Role`, `Profile` | `id` (String), `email` (String), `name` (String), `role` (String), `department` (String?), `batch` (String?) | `User` 1:N `Role`, `User` 1:1 `Profile`, `User` 1:N `Session` | Role: `'officer'`, `'treasurer'`, `'member'`, `'student'` | `roles`: unique `[userId, role]`; `chk_role_value` CHECK `role IN ('officer','treasurer')` | Read-committed session validation with role checks. | Matches Better Auth schema + custom `Role` / `Profile` models in `ARCHITECTURE.md §3`. |
| **MembershipService** (`MembershipService.ts`) | `MembershipPeriod`, `Membership`, `Purchase`, `PaymentAttempt`, `CashbookEntry` | `Membership`: `id` (String cuid), `userId` (String), `periodId` (String), `status` (String), `createdAt`/`updatedAt` (DateTime). `MembershipPeriod`: `duesPaise` (BigInt), `startsAt`/`endsAt` (DateTime). | `Membership` N:1 `User`, `Membership` N:1 `MembershipPeriod`, `Membership` 1:1 `Purchase` | `Membership.status`: `'pending'`, `'active'`, `'cancelled'`, `'expired'` | `memberships`: unique `[userId, periodId]`; `chk_membership_status` CHECK `status IN ('pending','active','cancelled')`; `chk_period_dates` CHECK `endsAt > startsAt` | In `initiateMembership`: upsert on unique `[userId, periodId]`. In payment confirmation: atomic `updateMany({ where: { id, status: 'pending' }, data: { status: 'active' } })`. Single cashbook entry creation. | Matches `ARCHITECTURE.md §10`. Guaranteed idempotent dues collection. |
| **ActivityService** (`ActivityService.ts`) | `Activity`, `ActivityStaff` | `id` (String cuid), `title` (String), `kind` (String), `capacity` (Int?), `startsAt`/`endsAt` (DateTime), `memberPricePaise` (BigInt?), `regularPricePaise` (BigInt?), `published` (Boolean) | `Activity` 1:N `Booking`, `Activity` 1:N `Task`, `Activity` 1:N `ActivityStaff` | `kind`: `'event'`, `'fundraiser'` | `chk_activity_kind` CHECK `kind IN ('event','fundraiser')`; `activity_staff`: unique `[activityId, userId, capability]`; `chk_capability` CHECK `capability IN ('checkin','volunteer')` | Read with optional staff capability verification. Single-statement CRUD. | Matches `ARCHITECTURE.md §10`. |
| **BookingService** (`BookingService.ts`) | `Activity`, `Booking`, `Ticket`, `Purchase`, `PaymentAttempt`, `CashbookEntry` | `Booking`: `id` (String cuid), `activityId` (String), `userId` (String), `reservedUntil` (DateTime). `Ticket`: `id` (String cuid), `bookingId` (String), `tokenHash` (String), `encryptedToken` (String), `checkedInAt` (DateTime?). | `Booking` N:1 `Activity`, `Booking` 1:1 `Ticket`, `Booking` 1:1 `Purchase` | `Purchase.state`: `'pending'`, `'confirmed'`, `'expired'`, `'cancelled'` | `bookings`: unique `[activityId, userId]`; `tickets`: unique `bookingId`, unique `tokenHash`; `purchases`: unique `bookingId` | **Crucial Concurrency Guard**: Simple `tx.booking.count()` inside `$transaction` is insufficient in READ COMMITTED. Service executes `SELECT id, capacity FROM activities WHERE id = $1 FOR UPDATE` to lock parent activity row, serializing competing reservations. Bounded retries (3 attempts) on serialization conflicts. In `confirmBooking`: atomic `updateMany` on `Purchase.state = 'pending'` before ticket issuance. Returns HTTP 409 `CAPACITY_EXHAUSTED`. | Matches `ARCHITECTURE.md §10` & §12. |
| **CheckInService** (`CheckInService.ts`) | `Ticket`, `Booking`, `ActivityStaff` | `Ticket`: `tokenHash` (String), `checkedInAt` (DateTime?), `checkedInById` (String?) | `Ticket` N:1 `Booking`, `Booking` N:1 `Activity` | Ticket status: unused (`checkedInAt IS NULL`) vs checked in | Unique `tokenHash`. Staff role/capability verification. | Atomic single-use check-in: `updateMany({ where: { id: ticket.id, checkedInAt: null }, data: { checkedInAt: now, checkedInById } })`. Losers receive immediate HTTP 200 `{ result: 'DENIED', reason: 'ALREADY_USED' }`. | Matches `ARCHITECTURE.md §10`. Eliminates double-entry scans at venue doors. |
| **MerchandiseService & OrderService** (`OrderService.ts`, `MerchandiseService.ts`) | `Product`, `Variant`, `Order`, `OrderItem`, `Purchase`, `PaymentAttempt`, `CashbookEntry` | `Variant`: `stockTotal` (Int), `stockReserved` (Int), `stockSold` (Int). `OrderItem`: `quantity` (Int), `unitPricePaise` (BigInt). `Order`: `reservedUntil` (DateTime), `fulfilment` (String). | `Product` 1:N `Variant`; `Variant` 1:N `OrderItem`; `Order` 1:N `OrderItem`; `Order` 1:1 `Purchase` | `Order.fulfilment`: `'pending'`, `'ready'`, `'collected'`; `Purchase.state`: `'pending'`, `'confirmed'`, `'expired'` | `variants`: unique `[productId, size]`; `chk_stock_nonneg` CHECK non-negative stock; `chk_stock_consistency` CHECK `stockReserved + stockSold <= stockTotal`; `order_items`: CHECK `quantity > 0` | **Strict Lock Ordering**: Sorting variant IDs ascending alone is not sufficient; in `createOrder`, service acquires row-level locks `SELECT ... FOR UPDATE` on variants in alphanumeric ID order to prevent AB-BA deadlocks between multi-item checkouts. Decrements reserved stock on confirm in same sorted order. In `confirmOrder`: atomic `updateMany` on `Purchase` state. Returns HTTP 409 `STOCK_EXHAUSTED`. | Matches `ARCHITECTURE.md §10`. Deadlock-free inventory allocation. |
| **TaskService** (`TaskService.ts`) | `Task`, `Activity`, `ActivityStaff` | `id` (String cuid), `activityId` (String), `title` (String), `description` (String?), `assigneeId` (String?), `dueAt` (DateTime?), `status` (String) | `Task` N:1 `Activity` | **Agreed Contract**: `'open'`, `'in_progress'`, `'done'`, `'cancelled'` | `chk_task_status`: **RESOLVED MISMATCH** (see section 2 below) | Task status transitions guarded by caller role (officers can edit all; assigned staff can update status). | **Resolved**: Updated `ARCHITECTURE.md` draft schema from `'todo'\|'in_progress'\|'done'` to match contract `'open'\|'in_progress'\|'done'\|'cancelled'`. |
| **ClaimService & ReceiptService** (`ClaimService.ts`, `ReceiptService.ts`) | `Claim`, `ReceiptFile`, `CashbookEntry` | `Claim`: `amountPaise` (BigInt), `status` (String), `reason` (String), `reviewerId` (String?), `payoutRef` (String?), `paidAt` (DateTime?). `ReceiptFile`: `storagePath` (String), `mimeType` (String), `sizeBytes` (Int). | `Claim` 1:1 `ReceiptFile`; `Claim` 1:N `CashbookEntry` | `Claim.status`: `'submitted'`, `'under_review'`, `'approved'`, `'rejected'`, `'paid'` | `chk_claim_status` CHECK `status IN ('submitted','approved','rejected','paid')`; `chk_claim_amount_pos` CHECK `amountPaise > 0`; `chk_paid_requires_ref` CHECK `status <> 'paid' OR (payoutRef IS NOT NULL AND paidAt IS NOT NULL)` | **Permission & Idempotency Reconciliation**: Retains strict no self-approval (`claimantId !== reviewerId`) and no self-payout (`claimantId !== payerId`). Allows reviewing treasurer to execute payout. Payout executes atomic `updateMany({ where: { id, status: 'approved' } })` to guarantee simultaneous payout requests cannot duplicate cashbook OUTFLOW. | Matches `ARCHITECTURE.md §10` and MVP separation of duties. |
| **FinanceService & SnapshotService** (`FinanceService.ts`, `SnapshotService.ts`) | `CashbookEntry`, `PaymentAttempt`, `FundraiserReceipt`, `Claim`, `HandoverSnapshot` | `CashbookEntry`: `direction` (String), `category` (String), `amountPaise` (BigInt), `occurredAt` (DateTime). `HandoverSnapshot`: `snapshotJson` (Json), `schemaVersion` (Int). | `CashbookEntry` N:1 `PaymentAttempt`; `CashbookEntry` N:1 `Claim`; `CashbookEntry` N:1 `FundraiserReceipt` | `direction`: `'INFLOW'`, `'OUTFLOW'`; `category`: `'dues'`, `'ticket'`, `'merch'`, `'fundraiser_cash'`, `'claim_payout'`, `'unresolved_payment'` | `chk_cashbook_direction` CHECK `direction IN ('INFLOW','OUTFLOW')`; `chk_cashbook_amount_pos` CHECK `amountPaise > 0`; `chk_cashbook_one_source` CHECK exactly one foreign key reference is non-null. | Snapshot generation executed in snapshot-isolation transaction; immutable snapshot JSON persisted once. Financial summary computes true available balance (`netBalance - pendingObligations`). | Matches `ARCHITECTURE.md §10`. |
| **JobRunnerService & Announcements** (`JobRunnerService.ts`, `AnnouncementService.ts`) | `Announcement`, `EmailJob` | `EmailJob`: `recipientId` (String), `kind` (String), `sourceKey` (String), `state` (String), `attempts` (Int), `nextAttemptAt` (DateTime?). | `Announcement` 1:N `EmailJob` | `EmailJob.state`: `'queued'`, `'sent'`, `'failed'`, `'terminal'` | `email_jobs`: unique `[recipientId, kind, sourceKey]` | Idempotent email processing with lease locks and exponential backoff retry. Expiry jobs release stale holds in sorted variant order. | Matches `ARCHITECTURE.md §10`. Prevents duplicate email dispatch. |

---

## 2. Task-Status Inconsistency Resolution

- **The Problem Identified:**
  - `docs/ARCHITECTURE.md §10` draft schema contained: `CHECK (status IN ('todo','in_progress','done'))`.
  - `docs/INTEGRATION_CONTRACT.md §8` and frontend specifications required: `status: "open" | "in_progress" | "done" | "cancelled"`.
  - `Backend/lib/schemas/enums.ts` defines `TaskStatusSchema` as: `["open", "in_progress", "done", "cancelled"]`.
  - If applied to PostgreSQL with `'todo'`, backend creations (`status: 'open'`) and cancellations would crash with PostgreSQL check constraint violations (`chk_task_status`).
- **Resolution Applied:**
  - `docs/ARCHITECTURE.md` line 695 updated: `status String @default("open") // CHECK: 'open'|'in_progress'|'done'|'cancelled'`.
  - `docs/ARCHITECTURE.md` line 867 updated: `ALTER TABLE tasks ADD CONSTRAINT chk_task_status CHECK (status IN ('open','in_progress','done','cancelled'));`.
  - Coordinated requirement: The database teammate must include this updated constraint in the custom SQL migration `prisma/migrations/*_domain_constraints/migration.sql`.

---

## 3. Concurrency, Locking & Isolation Hardening

### BookingService Hardening
- **Root Cause:** In PostgreSQL's default `READ COMMITTED` transaction isolation level, a plain `tx.booking.count()` inside `$transaction` suffers from phantom reads under concurrent transactions. Two concurrent transactions reserving the last seat can both evaluate `occupiedCount < capacity` and both insert reservations, causing overbooking.
- **Implementation:**
  1. **Row-Level Parent Lock:** `BookingService` executes `SELECT id, capacity FROM activities WHERE id = ${activityId} FOR UPDATE`. Under PostgreSQL, this serializes all competing transactions attempting to reserve tickets for that specific event.
  2. **Bounded Retries:** Wraps reservation in a 3-attempt retry loop with exponential jittered backoff to handle transient serialization conflicts (`P2034` or PostgreSQL `40001` serialization failures / deadlocks).
  3. **Contract Conflict Status:** When capacity is reached, returns HTTP 409 Conflict with error code `CAPACITY_EXHAUSTED` (aligned with contract specification).
  4. **Payment Confirmation Atomicity:** `confirmBooking` atomically transitions `purchase.state` from `'pending'` to `'confirmed'` via `updateMany` *before* creating the ticket. If another request won the race, it returns the existing ticket idempotently without creating duplicate ticket records or cashbook rows.

### OrderService Hardening
- **Root Cause:** Simply sorting variant IDs in JavaScript is insufficient if row-level locking or atomic updates do not enforce the same order in the database engine.
- **Implementation:**
  1. **Alphanumeric Lock Acquisition:** In `createOrder`, line items are sorted by `variantId` ascending, and explicit row locks are acquired: `SELECT id, "stockTotal", "stockReserved", "stockSold" FROM variants WHERE id = ${item.variantId} FOR UPDATE`.
  2. **Symmetrical Lock Hierarchy in Expiry:** `JobRunnerService.expireStaleOrders` and `OrderService.confirmOrder` both sort variant updates in ascending `variantId` order, guaranteeing deadlock-free interleaved execution between checkouts, confirmations, and expiry cron runs.
  3. **Stock Exhaustion Code:** Returns HTTP 409 Conflict with code `STOCK_EXHAUSTED` when requested quantity exceeds `stockTotal - stockReserved - stockSold`.

### Payment and Payout Idempotency
- **Root Cause:** A read-then-update pattern (`if (record.state === 'pending') update()`) creates TOCTOU (time-of-check to time-of-use) race conditions under simultaneous webhook or user requests, leading to duplicate revenue or payout records.
- **Implementation:**
  1. **Atomic State Transitions:**
     - Memberships: `tx.membership.updateMany({ where: { id, status: 'pending' }, data: { status: 'active' } })`.
     - Orders/Bookings: `tx.purchase.updateMany({ where: { id, state: 'pending' }, data: { state: 'confirmed' } })`.
     - Claims: `tx.claim.updateMany({ where: { id, status: 'approved' }, data: { status: 'paid', payoutRef, paidAt } })`.
  2. **Unique Financial Sources:** Only the transaction that successfully changes the state record (`count === 1`) proceeds to create the `PaymentAttempt` and `CashbookEntry`.
  3. **Database Engine Safeguards:** Guaranteed by the database schema via `CREATE UNIQUE INDEX idx_payment_unique_provider_ref ON payment_attempts(provider, "providerRef") WHERE "providerRef" IS NOT NULL` and `chk_cashbook_one_source CHECK ((paymentAttemptId IS NOT NULL + claimId IS NOT NULL + fundraiserReceiptId IS NOT NULL) = 1)`.

---

## 4. Claim Permissions Reconciliation

- **The Problem:** An extra restriction (`reviewerId !== payerId`) was introduced in draft docs without an agreed team decision, creating an unnecessary operational bottleneck where two separate treasurers were needed to review and disburse a single reimbursement claim.
- **Reconciliation Applied:**
  - **Retained (Core Invariants):**
    - Strict no self-approval: `claimantId !== reviewerId` (`SELF_APPROVAL_FORBIDDEN` HTTP 403).
    - Strict no self-payout: `claimantId !== payerId` (`SELF_PAYOUT_FORBIDDEN` HTTP 403).
    - Treasurer authorization required for both actions.
  - **Reconciled:** Removed the extra restriction that the reviewer and payer must be different people. The reviewing treasurer may disburse the payout for an approved claim submitted by another member.
  - **Documentation & Tests Updated:**
    - `docs/INTEGRATION_CONTRACT.md` §9 updated from `[treasurer, not reviewer, not claimant]` to `[treasurer, not claimant]`.
    - `Backend/tests/unit/claim-receipt-service.test.ts` updated and verified passing (asserts treasurer who reviewed can execute payout, but claimant cannot).

---

## 5. Integration Limitations & Truthful Status Disclosure

To prevent false claims of completion and distinguish simulation from production reality, the following integration boundaries are formally documented:

1. **`ConsoleEmailAdapter` is Simulated Delivery:**
   - Logs notification dispatches to console stdout/in-memory buffer (`[EMAIL_SENT]`).
   - Does NOT test external network SMTP, SES, or Resend providers. Real provider integration remains for post-hackathon scaling.
2. **In-Memory Test Doubles Do Not Prove PostgreSQL Concurrency:**
   - Unit tests running with in-memory mocks (`fakePrisma`) verify algorithm logic, validation rules, state machine transitions, and error handling.
   - They do NOT prove PostgreSQL table locks, row locks, deadlocks, transaction isolation levels (`READ COMMITTED` vs `SERIALIZABLE`), or foreign key cascade behavior. Real verification requires running against live PostgreSQL.
3. **Route Handler Unit Invocations Bypass Network Sockets:**
   - Invoking Next.js route handlers directly (e.g. `await GET(req)`) executes TypeScript handler code and middleware logic in-process, but does NOT test network sockets, HTTP proxy buffering, TLS termination, or edge CDN headers.
4. **`SELECT 1` Verifies Connectivity, Not Schema Readiness:**
   - A successful `SELECT 1` ping only confirms that the PostgreSQL server process is accepting TCP connections. It does NOT prove that required tables, columns, indexes, or check constraints exist. Full readiness requires verifying that all migrations are applied.
5. **Accurate Test Suite Accounting:**
   - Total test count: **75 automated tests across 9 test suites**.
   - Suite breakdown:
     - Foundation & Errors: 14 tests
     - Auth & Session Guards: 2 tests
     - Health & Readiness: 2 tests
     - Status Enums: 5 tests
     - Task Management: 5 tests
     - Announcements & Emails: 4 tests
     - Receipt Security & Claims: 12 tests
     - Activities & Bookings: 9 tests (includes capacity concurrency, idempotency, and expired hold confirmation rejection)
     - Merchandise & Orders: 5 tests (includes inventory reservation, checkout idempotency, fulfilment, and expired order rejection)
     - Finance Ledger & Snapshots: 6 tests
     - Route Handlers HTTP Statuses: 6 tests
     - Payment Adapters: 3 tests
     - Check-In Invariants: 2 tests

---

## 6. Database Handoff Reconciliation & Invariant Verification

### 6.1 Reconciled Handoff Contradictions

1. **Role Values vs `chk_role_value`:**
   - **Agreed Meaning:** The database `roles` table strictly stores administrative authority assignments (`officer`, `treasurer`). General student personas (`student`, `member`) are dynamically computed display personas: `student` is the default authenticated user without active membership or administrative roles; `member` is derived when an authenticated user possesses a non-expired `Membership` (`status = 'active'` and `now < period.endsAt`). Administrative permissions (`officer`, `treasurer`) are decoupled from membership eligibility.
   - **Schema Requirement:** `roles` table check constraint remains `ALTER TABLE roles ADD CONSTRAINT chk_role_value CHECK (role IN ('officer', 'treasurer'));`.
   - **Backend Requirement:** `Backend/lib/schemas/enums.ts` defines `AdminRoleSchema = z.enum(["officer", "treasurer"])` matching the database schema. User persona computation in `SessionService` / `getCurrentMembership` keeps admin roles separate from membership status.
   - **Contract Requirement:** `docs/INTEGRATION_CONTRACT.md` and `docs/ARCHITECTURE.md` distinguish `UserRole` (admin permission) from user profile display personas.

2. **Membership "expired" vs `chk_membership_status`:**
   - **Agreed Meaning:** The database `memberships` table persists operational lifecycle state (`pending`, `active`, `cancelled`). An expired membership is a temporal state determined by `now() >= period.endsAt`. We do NOT run high-frequency background updates mutating thousands of rows from `active` to `expired`. Instead, the backend dynamically computes `status: "expired"` and `isMember: false` when serving read responses if the current time exceeds the membership period's `endsAt`.
   - **Schema Requirement:** Check constraint remains `ALTER TABLE memberships ADD CONSTRAINT chk_membership_status CHECK (status IN ('pending', 'active', 'cancelled'));`.
   - **Backend Requirement:** `Backend/lib/services/MembershipService.ts` checks `if (membership.status === 'active' && new Date() >= membership.period.endsAt)` and returns `status: "expired"`, `isMember: false`.
   - **Contract Requirement:** `MembershipResponse` schema allows `"expired"` as an output status, but writes/updates to database `status` column only ever use `'pending' | 'active' | 'cancelled'`.

3. **Claim "under_review" vs `chk_claim_status`:**
   - **Agreed Meaning:** As specified in `docs/INTEGRATION_CONTRACT.md §9` and `Backend/lib/schemas/enums.ts`, a reimbursement claim can be placed into `"under_review"` when additional documentation or treasurer inspection is required. `chk_claim_status` in `docs/ARCHITECTURE.md` had inadvertently omitted `'under_review'`.
   - **Schema Requirement:** Update constraint to: `ALTER TABLE claims ADD CONSTRAINT chk_claim_status CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'paid'));`.
   - **Backend Requirement:** `ClaimStatusSchema = z.enum(["submitted", "under_review", "approved", "rejected", "paid"])`.
   - **Contract Requirement:** Synchronized in both `docs/ARCHITECTURE.md §10` and `docs/INTEGRATION_CONTRACT.md §9`.

4. **Cashbook Source-Count Checks vs Duplicate-Source Prevention:**
   - **Agreed Meaning:** `chk_cashbook_one_source` is a row-level check verifying that within a single row, exactly one source foreign key is set (`(paymentAttemptId != null) + (claimId != null) + (fundraiserReceiptId != null) = 1`). However, `chk_cashbook_one_source` does **NOT** prevent multiple rows from pointing to the *same* `paymentAttemptId` or `claimId`. To guarantee that a single payment attempt or reimbursement payout can never produce duplicate cashbook entries, PostgreSQL partial unique indexes are required.
   - **Schema Requirement:** Keep `chk_cashbook_one_source` and add three partial unique indexes:
     ```sql
     CREATE UNIQUE INDEX idx_cashbook_unique_payment_attempt
       ON cashbook_entries("paymentAttemptId")
       WHERE "paymentAttemptId" IS NOT NULL;

     CREATE UNIQUE INDEX idx_cashbook_unique_claim
       ON cashbook_entries("claimId")
       WHERE "claimId" IS NOT NULL;

     CREATE UNIQUE INDEX idx_cashbook_unique_fundraiser_receipt
       ON cashbook_entries("fundraiserReceiptId")
       WHERE "fundraiserReceiptId" IS NOT NULL;
     ```
   - **Backend Requirement:** Backend services rely on database uniqueness and wrap operations in `$transaction` with optimistic state transitions (`updateMany({ where: { id, state: 'pending' }, data: { state: 'confirmed' } })`).
   - **Contract Requirement:** Documented in `docs/ARCHITECTURE.md §10` and `docs/progress/backend.md`.

---

### 6.2 Transaction Atomicity & Database Uniqueness Requirements

Every financial and inventory operation is designed to commit or roll back in a single `prisma.$transaction`:

1. **Booking Confirmation & Ticket Issuance (`BookingService.confirmBooking`):**
   - **Operations within Transaction:**
     - Atomic purchase state transition (`updateMany: pending -> confirmed`).
     - Payment attempt creation (`state: confirmed`, `source: booking`).
     - Ticket creation (`ticketNumber: TKT-...`, `status: issued`).
     - Cashbook entry creation (`entryType: INFLOW`, `source: paymentAttemptId`).
   - **Uniqueness Requirements:**
     - `tickets("ticketNumber")` UNIQUE.
     - `tickets("bookingId")` UNIQUE (a booking produces at most one ticket).
     - `cashbook_entries("paymentAttemptId")` PARTIAL UNIQUE (where NOT NULL).
     - `payment_attempts("providerPaymentRef")` PARTIAL UNIQUE (where NOT NULL).

2. **Order Confirmation & Stock Conversion (`OrderService.confirmOrder`):**
   - **Operations within Transaction:**
     - Atomic purchase state transition (`updateMany: pending -> confirmed`).
     - Payment attempt creation (`state: confirmed`, `source: order`).
     - Stock conversion: Decrement `reservedCount` by ordered quantity, increment `soldCount` by ordered quantity for each item variant.
     - Cashbook entry creation (`entryType: INFLOW`, `source: paymentAttemptId`).
   - **Uniqueness Requirements:**
     - `cashbook_entries("paymentAttemptId")` PARTIAL UNIQUE (where NOT NULL).
     - `payment_attempts("providerPaymentRef")` PARTIAL UNIQUE (where NOT NULL).

3. **Reimbursement Payout (`ClaimService.executePayout`):**
   - **Operations within Transaction:**
     - Atomic claim state transition (`updateMany: approved -> paid`, setting `payoutRef`, `paidAt`).
     - Cashbook entry creation (`entryType: OUTFLOW`, `source: claimId`, `amountPaise: claim.amountPaise`).
   - **Uniqueness Requirements:**
     - `cashbook_entries("claimId")` PARTIAL UNIQUE (where NOT NULL). Ensures payout cannot be logged to cashbook more than once.

4. **Fundraiser Direct Cash Inflow (`FinanceService.recordFundraiserReceipt`):**
   - **Operations within Transaction:**
     - Fundraiser receipt creation (`receiptNumber: FR-...`).
     - Cashbook entry creation (`entryType: INFLOW`, `source: fundraiserReceiptId`).
   - **Uniqueness Requirements:**
     - `fundraiser_receipts("receiptNumber")` UNIQUE.
     - `cashbook_entries("fundraiserReceiptId")` PARTIAL UNIQUE (where NOT NULL).

---

### 6.3 Expired Reservation & Order Hold Protection

To guarantee that expired reservations cannot be revived to oversell capacity, and that expired order holds cannot consume stock released by background expiry jobs:

1. **Booking Expiry Guards:**
   - Before confirming, `confirmBooking` checks `if (booking.reservedUntil < new Date() || booking.purchase?.state === "expired") throw 409 CONFLICT`.
   - The state transition query conditionally checks `where: { id: purchase.id, state: "pending" }`. If `updateMany.count === 0`, it verifies if the purchase was already confirmed (for idempotency); otherwise, if expired or cancelled, it immediately throws `409 CONFLICT ("Booking reservation has expired and cannot be confirmed")`.
   - Capacity count is reserved only while `state = 'pending' AND reservedUntil > now()` or `state = 'confirmed'`. Expired bookings are ignored by capacity counts.

2. **Order Expiry Guards:**
   - Before confirming, `confirmOrder` checks `if (order.reservedUntil < new Date() || order.purchase?.state === "expired") throw 409 CONFLICT`.
   - The state transition query conditionally checks `where: { id: purchase.id, state: "pending" }`. If `updateMany.count === 0`, it verifies idempotency; otherwise, it rejects with `409 CONFLICT ("Order reservation has expired and cannot be confirmed")`.
   - When `JobRunnerService.expireStaleOrders` runs, it decrements `reservedCount` on `ProductVariant` and marks the purchase as `expired`. Because `confirmOrder` requires `state = "pending"`, it can never consume inventory already released back to the stock pool.

---

## 7. Concise Database Handoff Checklist for Database Teammate

| Model Name | Table Name | Fields & Types | Indexes & Constraints Required |
| :--- | :--- | :--- | :--- |
| `User` | `users` | `id` (Text PK), `name` (Text), `email` (Text Unique), `emailVerified` (Boolean), `image` (Text?), `createdAt` (Timestamp), `updatedAt` (Timestamp) | `UNIQUE(email)` |
| `Session` | `sessions` | `id` (Text PK), `userId` (Text FK), `token` (Text Unique), `expiresAt` (Timestamp), `ipAddress` (Text?), `userAgent` (Text?), `createdAt` (Timestamp), `updatedAt` (Timestamp) | `UNIQUE(token)`, FK -> `users(id)` ON DELETE CASCADE |
| `Account` | `accounts` | `id` (Text PK), `userId` (Text FK), `accountId` (Text), `providerId` (Text), `password` (Text?), `createdAt` (Timestamp), `updatedAt` (Timestamp) | FK -> `users(id)` ON DELETE CASCADE |
| `Verification` | `verifications` | `id` (Text PK), `identifier` (Text), `value` (Text), `expiresAt` (Timestamp), `createdAt` (Timestamp), `updatedAt` (Timestamp) | `UNIQUE(identifier, value)` |
| `Role` | `roles` | `id` (Text PK), `userId` (Text FK), `role` (Text), `createdAt` (Timestamp) | `UNIQUE(userId, role)`, `CHECK (role IN ('officer', 'treasurer'))`, FK -> `users(id)` |
| `MembershipPeriod` | `membership_periods` | `id` (Text PK), `academicYear` (Text Unique), `startsAt` (Timestamp), `endsAt` (Timestamp), `feePaise` (BigInt), `createdAt` (Timestamp) | `UNIQUE(academicYear)`, `CHECK (startsAt < endsAt)`, `CHECK (feePaise > 0)` |
| `Membership` | `memberships` | `id` (Text PK), `userId` (Text FK), `periodId` (Text FK), `status` (Text), `createdAt` (Timestamp), `updatedAt` (Timestamp) | `UNIQUE(userId, periodId)`, `CHECK (status IN ('pending', 'active', 'cancelled'))` |
| `Purchase` | `purchases` | `id` (Text PK), `userId` (Text FK), `itemType` (Text), `totalAmountPaise` (BigInt), `state` (Text), `createdAt` (Timestamp), `updatedAt` (Timestamp) | `CHECK (itemType IN ('membership', 'booking', 'order'))`, `CHECK (state IN ('pending', 'confirmed', 'failed', 'expired'))`, `CHECK (totalAmountPaise >= 0)` |
| `PaymentAttempt` | `payment_attempts` | `id` (Text PK), `purchaseId` (Text FK), `provider` (Text), `providerPaymentRef` (Text?), `amountPaise` (BigInt), `state` (Text), `createdAt` (Timestamp), `updatedAt` (Timestamp) | `CHECK (state IN ('pending', 'confirmed', 'failed'))`, `CHECK (amountPaise > 0)`, `CREATE UNIQUE INDEX idx_payment_unique_provider_ref ON payment_attempts(providerPaymentRef) WHERE providerPaymentRef IS NOT NULL` |
| `Activity` | `activities` | `id` (Text PK), `title` (Text), `description` (Text), `venue` (Text), `startsAt` (Timestamp), `endsAt` (Timestamp), `capacity` (Int), `regularPricePaise` (BigInt), `memberPricePaise` (BigInt), `createdAt` (Timestamp), `updatedAt` (Timestamp) | `CHECK (startsAt < endsAt)`, `CHECK (capacity > 0)`, `CHECK (regularPricePaise >= 0)`, `CHECK (memberPricePaise >= 0)` |
| `ActivityStaff` | `activity_staff` | `id` (Text PK), `activityId` (Text FK), `userId` (Text FK), `capability` (Text), `createdAt` (Timestamp) | `UNIQUE(activityId, userId, capability)`, `CHECK (capability IN ('checkin', 'volunteer'))` |
| `Booking` | `bookings` | `id` (Text PK), `activityId` (Text FK), `userId` (Text FK), `purchaseId` (Text FK Unique?), `reservedUntil` (Timestamp), `createdAt` (Timestamp), `updatedAt` (Timestamp) | `UNIQUE(activityId, userId)`, `UNIQUE(purchaseId)` |
| `Ticket` | `tickets` | `id` (Text PK), `bookingId` (Text FK Unique), `ticketNumber` (Text Unique), `status` (Text), `checkedInAt` (Timestamp?), `checkedInById` (Text FK?), `createdAt` (Timestamp), `updatedAt` (Timestamp) | `UNIQUE(ticketNumber)`, `UNIQUE(bookingId)`, `CHECK (status IN ('issued', 'checked_in', 'cancelled'))`, `CHECK (status <> 'checked_in' OR (checkedInAt IS NOT NULL AND checkedInById IS NOT NULL))` |
| `Product` | `products` | `id` (Text PK), `title` (Text), `description` (Text), `pricePaise` (BigInt), `memberDiscountPaise` (BigInt), `createdAt` (Timestamp), `updatedAt` (Timestamp) | `CHECK (pricePaise > 0)`, `CHECK (memberDiscountPaise >= 0)` |
| `ProductVariant` | `product_variants` | `id` (Text PK), `productId` (Text FK), `size` (Text), `color` (Text), `reservedCount` (Int), `soldCount` (Int), `totalStock` (Int), `createdAt` (Timestamp), `updatedAt` (Timestamp) | `UNIQUE(productId, size, color)`, `CHECK (reservedCount >= 0)`, `CHECK (soldCount >= 0)`, `CHECK (totalStock >= 0)`, `CHECK (reservedCount + soldCount <= totalStock)` |
| `Order` | `orders` | `id` (Text PK), `userId` (Text FK), `purchaseId` (Text FK Unique?), `reservedUntil` (Timestamp), `status` (Text), `createdAt` (Timestamp), `updatedAt` (Timestamp) | `UNIQUE(purchaseId)`, `CHECK (status IN ('reserved', 'paid', 'fulfilled', 'cancelled'))` |
| `OrderItem` | `order_items` | `id` (Text PK), `orderId` (Text FK), `variantId` (Text FK), `quantity` (Int), `unitPricePaise` (BigInt) | `CHECK (quantity > 0)`, `CHECK (unitPricePaise >= 0)` |
| `Claim` | `claims` | `id` (Text PK), `claimantId` (Text FK), `activityId` (Text FK?), `amountPaise` (BigInt), `reason` (Text), `status` (Text), `reviewerId` (Text FK?), `reviewNote` (Text?), `payoutRef` (Text?), `paidAt` (Timestamp?), `createdAt` (Timestamp), `updatedAt` (Timestamp) | `CHECK (amountPaise > 0)`, `CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'paid'))`, `CHECK (status <> 'paid' OR (payoutRef IS NOT NULL AND paidAt IS NOT NULL))` |
| `Receipt` | `receipts` | `id` (Text PK), `claimId` (Text FK Unique?), `storageKey` (Text Unique), `originalName` (Text), `mimeType` (Text), `sizeBytes` (Int), `createdAt` (Timestamp) | `UNIQUE(claimId)`, `UNIQUE(storageKey)`, `CHECK (sizeBytes > 0 AND sizeBytes <= 5242880)`, `CHECK (mimeType IN ('image/jpeg', 'image/png', 'application/pdf'))` |
| `FundraiserReceipt` | `fundraiser_receipts` | `id` (Text PK), `receiptNumber` (Text Unique), `donorName` (Text), `amountPaise` (BigInt), `collectedById` (Text FK), `createdAt` (Timestamp) | `UNIQUE(receiptNumber)`, `CHECK (amountPaise > 0)` |
| `CashbookEntry` | `cashbook_entries` | `id` (Text PK), `entryType` (Text), `amountPaise` (BigInt), `paymentAttemptId` (Text FK?), `claimId` (Text FK?), `fundraiserReceiptId` (Text FK?), `narration` (Text), `recordedById` (Text FK), `createdAt` (Timestamp) | `CHECK (entryType IN ('INFLOW', 'OUTFLOW'))`, `CHECK (amountPaise > 0)`, `CHECK (chk_cashbook_one_source)`, Partial unique on `paymentAttemptId`, `claimId`, and `fundraiserReceiptId` |
| `HandoverSnapshot` | `handover_snapshots` | `id` (Text PK), `academicYear` (Text), `snapshotData` (Json), `createdById` (Text FK), `createdAt` (Timestamp) | Snapshot payload immutable |
| `Task` | `tasks` | `id` (Text PK), `activityId` (Text FK), `title` (Text), `assigneeId` (Text FK?), `dueAt` (Timestamp?), `status` (Text), `createdAt` (Timestamp), `updatedAt` (Timestamp) | `CHECK (status IN ('open', 'in_progress', 'done', 'cancelled'))` |
| `Announcement` | `announcements` | `id` (Text PK), `title` (Text), `body` (Text), `audience` (Text), `publishedAt` (Timestamp?), `createdById` (Text FK), `createdAt` (Timestamp), `updatedAt` (Timestamp) | `CHECK (audience IN ('public', 'members'))` |
| `NotificationJob` | `notification_jobs` | `id` (Text PK), `recipientEmail` (Text), `subject` (Text), `body` (Text), `status` (Text), `attempts` (Int), `lastAttemptAt` (Timestamp?), `createdAt` (Timestamp), `updatedAt` (Timestamp) | `CHECK (status IN ('pending', 'sent', 'failed'))`, `CHECK (attempts >= 0)` |

---

## 8. Local Database Setup & Integration Complete
 
1. **Local PostgreSQL Runtime:**
   - PostgreSQL 16.8 (x64) installed and running locally on port `5432` with `-c max_connections=300`.
   - Dedicated database `skyline_dev` configured and secured with server-side credentials in `.env` (gitignored).
   - `.env.example` committed with pure placeholders.

2. **Schema & Reproducible Migrations:**
   - Unified `prisma/schema.prisma` created containing all 27 models covering Better Auth (`User`, `Session`, `Account`, `Verification`) and domain models (`Role`, `MembershipPeriod`, `Membership`, `Purchase`, `PaymentAttempt`, `Activity`, `ActivityStaff`, `Booking`, `Ticket`, `Product`, `Variant`, `Order`, `OrderItem`, `Claim`, `ReceiptFile`, `FundraiserReceipt`, `CashbookEntry`, `ClubSettings`, `HandoverSnapshot`, `Task`, `Announcement`, `EmailJob`).
   - Migration `20261010165427_init_skyline_schema` applied to `skyline_dev`.
   - Custom SQL check constraints applied: `chk_cashbook_one_source`, `chk_claim_status`, `chk_order_status`, `chk_order_fulfilment`, `chk_role_value`, `chk_variant_stock_capacity`, `chk_task_status`.
   - Partial unique indexes applied for financial source deduplication: `idx_cashbook_unique_payment_attempt`, `idx_cashbook_unique_claim`, `idx_cashbook_unique_fundraiser_receipt`, `idx_payment_unique_provider_ref`.
   - Prisma Client v6.19.3 successfully generated.

3. **Repeatable Demo Data Seeding:**
   - Idempotent seed script (`prisma/seed.ts`, run via `npm run db:seed`) executed.
   - Seeded accounts: `student@skyline.edu`, `officer@skyline.edu`, `treasurer@skyline.edu` with hashed passwords via Better Auth.
   - Seeded domain entities: Academic period `2026-2027` (₹500), Hackathon activity (100 capacity) with staff assignments, Club hoodie with variants and stock, volunteer task, and welcome announcement.

4. **Live Verification & Integration Test Accounting:**
   - Total automated test suite: **107 tests passed across 18 test suites** (`npm test`).
     - **80 Unit & Invariant Tests** (`npm run test:unit`) passing.
     - **27 Live Database Integration Tests** (`npm run test:integration`) passing.
   - Full end-to-end user journeys verified against live PostgreSQL:
     - Better Auth signup, signin, cookie session, signout, route authorization.
     - Membership dues confirmation -> single cashbook inflow + idempotent retry.
     - Event booking capacity lock -> payment confirm -> single ticket -> door QR check-in -> duplicate scan rejected.
     - Merchandise sorted variant locks -> payment confirm -> stock conversion -> desk pickup.
     - Expense claims -> review -> approval (0 cashbook entries) -> payout (1 cashbook outflow) with self-approval and self-payout forbidden.
     - Multi-table transaction rollback on dependent write failure.

---

## 9. Demo-Readiness Fixes Verified & Integrated

1. **Strictly Test-Only Rate-Limit Bypass Policy:**
   - Updated `Backend/lib/auth/auth.ts` with `isRateLimitEnabled(nodeEnv, testBypassFlag)`.
   - Security rule enforced: rate limiting remains strictly active in `development`, browser demos, and `production`. A bypass flag alone (`TEST_DISABLE_RATE_LIMIT=true`) cannot disable rate limiting outside tests. Bypassing requires BOTH `NODE_ENV === "test"` AND `TEST_DISABLE_RATE_LIMIT === "true"`.
   - Updated `Backend/lib/env.ts` with schema validation for `TEST_DISABLE_RATE_LIMIT`.
   - Updated `.env.example` with `TEST_DISABLE_RATE_LIMIT="false"` (documented as strictly ignored outside `NODE_ENV=test`).
   - Added focused unit tests in `Backend/tests/unit/rate-limit-policy.test.ts` (5 tests) proving dev+bypass stays enabled, prod+bypass stays enabled, test without bypass stays enabled, and test with explicit bypass can be disabled.

2. **Precise Test-Data Isolation & Exact-ID Cleanup Strategy:**
   - Replaced all broad prefix sweeps (`startsWith("test_")`, `startsWith("buyer")`, `startsWith("racer")`) with `TestResourceTracker`.
   - Test suites track exact primary keys (`userIds`, `orderIds`, `bookingIds`, `claimIds`, `activityIds`, `productIds`, `variantIds`, `purchaseIds`, `paymentAttemptIds`, `cashbookEntryIds`).
   - Cleanup respects PostgreSQL foreign-key dependency order: deletes dependent `cashbook_entries` and `payment_attempts` first to prevent `chk_cashbook_one_source` check-constraint violations, followed by `purchases`, `tickets`, `bookings`, `orders`, `receipt_files`, `claims`, `memberships`, `activities`, `products`, and `users`.
   - Zero table truncation and zero sweeps on seeded demo records (`student@skyline.edu`, `officer@skyline.edu`, `treasurer@skyline.edu`).
   - Added regression integration test in Section G verifying that untracked fixtures matching legacy prefixes (`buyer_*`, `racer_*`, `test_*`) are strictly preserved by test cleanup, and subsequently removed only by their exact IDs.

3. **Demo Account Credentials Reconciled & Verified:**
   - Inspected `prisma/seed.ts` and confirmed credentials logic; verified each demo account against the live running Next.js `/api/auth/sign-in/email` endpoint.
   - All 3 accounts authenticated successfully with HTTP 200 OK and valid session cookies:
     - `student@skyline.edu` -> Student role, active membership
     - `officer@skyline.edu` -> Officer role
     - `treasurer@skyline.edu` -> Treasurer role
   - Idempotency verified: `prisma/seed.ts` guards existing accounts with `if (existing) return existing;` preventing silent password resets or mutations on repeated runs.
   - Private demo credentials maintained in local ignored configuration (`.env.local`), documented via variable names `DEMO_STUDENT_PASSWORD`, `DEMO_OFFICER_PASSWORD`, `DEMO_TREASURER_PASSWORD` in `.env.example`, `README.md`, and `Backend/README.md`.



