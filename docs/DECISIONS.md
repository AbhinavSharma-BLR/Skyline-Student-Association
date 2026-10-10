# docs/DECISIONS.md — Architectural Decision Records

**Owner:** This file. All significant architectural and product decisions live here.
**Last updated:** 2026-10-10 (revised: Supabase → local stack per ADR-012)

Distinguish user-approved decisions from defaults proposed by the agent/architect.
Format: lightweight ADR (Architectural Decision Record).

---

## ADR-001: Modular Monolith Architecture

| Field | Value |
|---|---|
| **ID** | ADR-001 |
| **Date** | 2026-10-10 |
| **Status** | Accepted |
| **Proposed by** | Technical architect (agent default) |
| **User approved** | Pending confirmation |

**Context:** Hackathon with four people, 24 hours, one club, one database. Need fast development velocity without distributed system overhead.

**Decision:** One Next.js application with one PostgreSQL database. Domain logic in `lib/services/`. Provider adapters for external services. No microservices, no separate Express server, no message broker.

**Alternatives:**
- Separate Express API + Next.js frontend: extra deployment complexity; no benefit at this scale.
- Microservices: significant overhead; debugging and integration time unacceptable in 24 hours.

**Reason:** Simplest system that correctly enforces all transaction boundaries. All domain services share the same DB connection for atomic multi-table operations. Easiest to debug under time pressure.

**Consequences:** All features in one codebase. Scaling requires moving to edge functions or splitting later (production concern, not hackathon scope).

**Revisit condition:** If the team has more time and decides to productionize (post-hackathon).

---

## ADR-002: Technology Stack

| Field | Value |
|---|---|
| **ID** | ADR-002 |
| **Date** | 2026-10-10 |
| **Status** | Accepted (revised per ADR-012 — Supabase services replaced) |
| **Proposed by** | Technical architect (agent default) |
| **User approved** | Yes — confirmed by jury discussion update |

**Context:** The student_organization_system PDF does not mandate Odoo or any specific technology. External competition rules may override this.

**Decision:** Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui + **local PostgreSQL** + **Prisma ORM** + **Better Auth** (email/password) + **local filesystem storage** + Zod + QR library + Demo payment adapter.

> Note: Initial design used Supabase (PostgreSQL + Auth + Storage). Revised after jury discussion — see ADR-012 for replacement rationale and full dependency mapping.

**Alternatives:**
- Odoo: if mandated by competition, this entire plan changes. Verify first.
- Firebase: No SQL transactions; harder to enforce referential integrity and concurrency.
- Plain Express + React: More boilerplate; more deployment complexity.
- Django + React: Context switch overhead; fewer team members may know both.
- Supabase-hosted: convenient but adds external service dependency and RLS complexity; replaced per ADR-012.

**Reason:** Next.js App Router provides server components and route handlers in one framework. Local PostgreSQL with Prisma gives full control, no connection limits, no external service dependency, and works offline during demo. Better Auth runs inside the Next.js process. TypeScript + Zod enforces schema consistency.

**Consequences:** Team must be comfortable with TypeScript and React. Local PostgreSQL requires each developer to install and run a local database instance. Demo machine must have PostgreSQL running and `uploads/` on a persistent disk.

**Revisit condition:** If competition rules mandate Odoo or another platform → rebuild from scratch. Verify before writing any code (ADR-002 is PROPOSED until verified).

---

## ADR-003: Single-Club Scope

| Field | Value |
|---|---|
| **ID** | ADR-003 |
| **Date** | 2026-10-10 |
| **Status** | Accepted |
| **Proposed by** | Technical architect (agent default) |
| **User approved** | Implicit (from prompt) |

**Context:** The PDF describes one association. Multi-tenancy would add significant schema and authorization complexity.

**Decision:** One club. No `club_id` foreign key on every table. `club_settings` is a singleton row.

**Alternatives:**
- Multi-club from day one: adds `club_id` to every query and RLS policy; too complex for hackathon.
- Tenant-aware from the start: optional future path if `club_id` is added as a column (non-breaking if done carefully).

**Reason:** Correctly enforces the stated MVP scope. Post-hackathon tenancy can be added with a migration.

**Consequences:** Cannot serve multiple clubs in the same deployment. A second club requires a new deployment.

**Revisit condition:** Post-hackathon production use with multiple clubs.

---

## ADR-004: Membership Period Policy

| Field | Value |
|---|---|
| **ID** | ADR-004 |
| **Date** | 2026-10-10 |
| **Status** | Accepted |
| **Proposed by** | Technical architect (agent default) |
| **User approved** | Pending |

**Context:** PDF p.2 states memberships "run out at the end of the year" but does not specify an exact date.

**Decision:** Officer configures period start, end and dues amount via `membership_periods` table. No hard-coded December or academic-calendar expiry. `is_current` flag marks the active sales period.

**Alternatives:**
- Hard-code December 31: breaks for clubs with academic-year (June–May) periods.
- Auto-derive from calendar year: same problem; not generalizable.

**Reason:** Flexible and correct. Officer sets the period before opening sales; system checks `now() BETWEEN starts_at AND ends_at`.

**Consequences:** Officer must configure period before any membership sales. Seed data must include this.

**Revisit condition:** If the club decides to always use a fixed calendar year — a database default can be added.

---

## ADR-005: Member Price Eligibility at Purchase Time

| Field | Value |
|---|---|
| **ID** | ADR-005 |
| **Date** | 2026-10-10 |
| **Status** | Accepted |
| **Proposed by** | TRD §2.2 / §6.2 |
| **User approved** | Implicit (from TRD) |

**Context:** A member might purchase a ticket in January but the event is in March, and their membership might expire in February.

**Decision:** Server checks membership eligibility at the moment of checkout initiation. The `pricing_basis` field is stored on the purchase record. A legitimately purchased ticket at member price remains valid even if membership expires before the event.

**Alternatives:**
- Re-check at check-in: unfair; member paid for the ticket at member price.
- Re-check at time of event: same problem; not implementable without changing confirmed purchase amounts.

**Reason:** The member made a fair transaction under valid conditions. Retroactively changing the price would be incorrect. The `pricing_basis` field provides an immutable audit trail.

**Consequences:** `pricing_basis` must be stored on every purchase. Financial reports can filter by basis.

**Revisit condition:** If club policy explicitly requires re-verification at event time.

---

## ADR-006: Source-Linked Cashbook (Not Full Accounting)

| Field | Value |
|---|---|
| **ID** | ADR-006 |
| **Date** | 2026-10-10 |
| **Status** | Accepted |
| **Proposed by** | TRD §11.1 |
| **User approved** | Implicit (from TRD) |

**Context:** PDF p.4 asks for "one place showing what came in, what went out, how much is left". Full double-entry accounting is listed as an explicit non-goal.

**Decision:** Simple source-linked cashbook. Every cashbook entry has a foreign key to exactly one source: a payment_attempt (INFLOW), a claim (OUTFLOW/payout), or a fundraiser_receipt (INFLOW). No editable dashboard totals. No double-entry journals.

**Alternatives:**
- Full double-entry accounting (debit/credit journal): too complex; overkill for this scope.
- Separate editable totals: loses source link; creates reconciliation drift.

**Reason:** Every total can be traced to its originating record. Approval alone never creates an entry. Only confirmed payments and recorded payouts do. Matches PDF requirements exactly.

**Consequences:** Cannot record arbitrary accounting adjustments without adding an adjustment record type (post-hackathon). Recorded balance ≠ bank balance (clearly labelled).

**Revisit condition:** Post-hackathon if full accounting is required.

---

## ADR-007: Private Receipt Storage

| Field | Value |
|---|---|
| **ID** | ADR-007 |
| **Date** | 2026-10-10 |
| **Status** | Accepted (revised per ADR-012 — local filesystem replaces Supabase Storage) |
| **Proposed by** | Technical architect + TRD §12 |
| **User approved** | Yes |

**Context:** Expense receipts contain personal financial data. They must be accessible to the claimant and authorized treasurer; nobody else.

**Decision:** Receipts stored in the server-managed `uploads/receipts/` directory **outside** `public/`. Object names are randomized UUIDs; user-supplied filenames never appear in paths. Access is gated by a server-side Route Handler that checks session and ownership before streaming the file. Extension, MIME type and file signature (magic bytes) are validated on upload. Maximum 5 MB. JPEG, PNG, PDF only. Path traversal check prevents escape from `UPLOAD_DIR`.

> Note: The original design used Supabase private Storage buckets. Replaced per ADR-012 — same security properties (random object name, no direct URL, server access gate) but using local filesystem instead of a cloud bucket.

**Alternatives:**
- Supabase private bucket: was the original choice; replaced per ADR-012.
- Public directory with obscure names: security through obscurity; inadequate.
- S3 / GCS cloud storage: adds external cloud dependency; deferred for post-hackathon if needed.
- Database BLOB storage: not suitable for large files in PostgreSQL.

**Reason:** Local filesystem has no external dependency, works offline during demo. Same security guarantee as a private bucket: files are not browsable via URL, access requires an authenticated server round-trip, and object names are randomized.

**Consequences:** Receipt download requires a server round-trip via `GET /api/v1/claims/:id/receipt`. Direct file paths never exposed to the browser. Demo machine and any hosted deployment must mount `UPLOAD_DIR` on a persistent disk (not ephemeral FS). Vercel serverless functions are incompatible.

**Revisit condition:** For hosted multi-user production, replace `uploads/receipts/` with an S3-compatible bucket. The `ReceiptFile` adapter interface wraps the filesystem; swapping it does not change service layer code.

---

## ADR-008: Online QR Scanning (Not Offline)

| Field | Value |
|---|---|
| **ID** | ADR-008 |
| **Date** | 2026-10-10 |
| **Status** | Accepted |
| **Proposed by** | Technical architect (agent default) |
| **User approved** | Pending |

**Context:** Campus events have internet access. Offline multi-device scanning with conflict resolution is an explicit non-goal.

**Decision:** Check-in is online-only. The scanner endpoint validates the token against the live database. Camera unavailable → manual code entry using the same server endpoint.

**Alternatives:**
- Offline scanning with sync: requires a conflict-resolution design; too complex for hackathon.
- Printed list at the door: defeats the digital system purpose.

**Reason:** Online scanning eliminates duplicate-scan risk because the database is the single source of truth. The atomic check-in transaction prevents double entry.

**Consequences:** Event venue must have internet connectivity. A connectivity failure means check-in is down (fallback: manual list; document this limitation clearly).

**Revisit condition:** If events are held in low-connectivity locations — requires offline-first design with sync.

---

## ADR-009: Demo/Test Payment Boundary

| Field | Value |
|---|---|
| **ID** | ADR-009 |
| **Date** | 2026-10-10 |
| **Status** | Accepted |
| **Proposed by** | TRD §2.2 / §16 |
| **User approved** | Implicit (from TRD) |

**Context:** Real payment provider credentials may not be available during the hackathon. Real money must not be processed on demo infrastructure.

**Decision:** A demo payment adapter is the baseline. It never contacts a bank. It returns a clearly labelled DEMO_CONFIRMED result. The `POST /payments/demo-confirm` endpoint is enabled only when `PAYMENT_MODE=demo`. In production, this endpoint is disabled. A test-provider (Razorpay test mode / Stripe test mode) can be substituted if credentials are available.

**Alternatives:**
- No payment integration at all: does not demonstrate the end-to-end flow.
- Real payment integration without safety: risk of accidental real charges.

**Reason:** Hackathon submissions must be demonstrable. Demo money allows full flow demonstration without financial risk. The boundary is explicit and visible.

**Consequences:** All demo transactions are labelled; judges understand these are not real payments. Production upgrade requires swapping the adapter and enabling webhook verification.

**Revisit condition:** When real provider credentials are available and the endpoint is hardened.

---

## ADR-010: Handover Snapshots (Frozen JSONB)

| Field | Value |
|---|---|
| **ID** | ADR-010 |
| **Date** | 2026-10-10 |
| **Status** | Accepted |
| **Proposed by** | TRD §3.4 / §11.4 |
| **User approved** | Implicit (from TRD) |

**Context:** The Committee Time Capsule differentiator requires that a snapshot generated in October is identical when printed in December, even after many subsequent transactions.

**Decision:** Snapshot generated inside a serializable read transaction. Stored as immutable JSONB in `handover_snapshots`. Schema version included. No UPDATE or DELETE allowed on snapshot rows by the application. Notes are captured at generation time; a later note edit requires a new snapshot.

**Alternatives:**
- Generate dynamically from live data: snapshot would change as data changes; defeats the purpose.
- PDF generation and storage: more complex; harder to search/filter.

**Reason:** Database-stored JSONB is queryable, indexable and immutable. Schema version allows future format evolution without breaking old snapshots.

**Consequences:** Snapshots can grow large over time. Archival strategy is a post-hackathon concern.

**Revisit condition:** If snapshot size becomes a storage concern.

---

## ADR-011: Deferred Features

| Field | Value |
|---|---|
| **ID** | ADR-011 |
| **Date** | 2026-10-10 |
| **Status** | Accepted |
| **Proposed by** | Technical architect (agent default) |
| **User approved** | Pending |

**Context:** Many features are desirable but not feasible in 24 hours.

**Decision:** Explicitly defer: voting/elections, multi-club tenancy, real-money refunds, bank integration, full double-entry accounting, offline scanning, native app, facial recognition, shipping/delivery, rich text editor, notification preferences/unsubscribe, malware scanning, automated backups.

**Alternatives:** Include all features: impossible in 24 hours; quality of P0 features would suffer.

**Reason:** A reliable P0 is more valuable than a broken P1.

**Consequences:** Deferred features must be noted in demo as future work, not labelled as complete.

**Revisit condition:** Post-hackathon production roadmap.

---

## ADR-012: Move from Supabase Services to Local PostgreSQL, Prisma, Better Auth and Local Storage

| Field | Value |
|---|---|
| **ID** | ADR-012 |
| **Date** | 2026-10-10 |
| **Status** | Accepted |
| **Proposed by** | User (post-jury-discussion directive) |
| **User approved** | Yes — explicit user instruction |

**Context:** After discussing the project with the hackathon jury, the decision was made to use standard local PostgreSQL instead of Supabase-hosted PostgreSQL, and to replace Supabase Auth and Supabase Storage with local application equivalents. The repository at this point contains documentation only — no application code, no client code, no migrations. This is a documentation and planning update.

**Decision:** Replace all Supabase services with local equivalents:

| Replaced | Replacement |
|---|---|
| Supabase-hosted PostgreSQL | Local PostgreSQL instance (native install or Docker) |
| Supabase JS client (`@supabase/supabase-js`) | Prisma ORM (`@prisma/client`) |
| Supabase Migrations (`supabase db push`) | Prisma Migrate (`prisma migrate dev/deploy`) |
| Supabase Auth | Better Auth library (runs inside Next.js, stores in PostgreSQL via Prisma adapter) |
| Supabase Auth RLS (`auth.uid()`, `auth.jwt()`) | Server-side authorization in Route Handlers and services |
| Supabase Storage bucket (receipts) | Server-managed `uploads/receipts/` directory outside `public/` |
| Supabase Storage signed URLs | `GET /api/v1/claims/:id/receipt` streams file from server |

**Affected environment variables (removed):**
- `NEXT_PUBLIC_SUPABASE_URL` — removed
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — removed
- `SUPABASE_SERVICE_ROLE_KEY` — removed

**New environment variables:**
- `DATABASE_URL` — PostgreSQL connection string (server-only, never `NEXT_PUBLIC_`)
- `BETTER_AUTH_SECRET` — session signing secret (server-only)
- `BETTER_AUTH_URL` — same as `NEXT_PUBLIC_APP_URL`
- `UPLOAD_DIR` — absolute path to private receipt storage directory

**What did NOT change:**
- PostgreSQL as the database engine (Supabase already ran PostgreSQL)
- All business invariants, schema design and transaction logic
- All financial formulas (paise-based, BigInt arithmetic)
- All API contracts and route structures (except auth routes now at `/api/auth/*`)
- All product requirements and user journeys (PRD.md unchanged)
- Email adapter interface
- Demo payment adapter interface
- Background job runner design
- Handover snapshot immutability
- QR check-in token design

**Alternatives:**
- Keep Supabase: adds external service dependency; requires online connectivity for auth/storage; jury feedback directed away from it.
- Use a different auth library (NextAuth/Auth.js): fewer built-in features; Prisma adapter for Better Auth is well-documented.
- Use a cloud storage provider (S3, GCS) for receipts: introduces another external dependency; local FS is simpler for demo; can be swapped later via the ReceiptFile abstraction.
- Use PostgreSQL RLS as an additional enforcement layer: possible but not required — Supabase-specific functions (`auth.uid()`) cannot be used; safe implementation requires careful transaction-level identity injection. Deferred as a defence-in-depth option.

**Reason:** Simpler local setup for hackathon. No external service accounts required. Works fully offline. Easier to demonstrate without network dependencies. Prisma provides type safety and a superior migration workflow for development. Better Auth is a maintained TypeScript-first library with a clean Prisma adapter.

**Consequences:**
- Each developer installs and runs a local PostgreSQL instance.
- Prisma migrations replace Supabase SQL migration files.
- Authorization is fully server-side; no database-level RLS.
- Demo machine must have PostgreSQL running and `uploads/` on a persistent disk.
- Hosted deployment requires a VPS or persistent-runtime host — Vercel serverless functions are incompatible with local PostgreSQL and ephemeral FS.
- `RECEIPT_TOKEN_ENCRYPTION_KEY` is retained for ticket QR token encryption.

**Revisit condition:** If moving to a hosted SaaS model post-hackathon, evaluate managed PostgreSQL (Railway, Neon, Fly Postgres) and cloud object storage for receipts. The Prisma schema and Better Auth setup are compatible with any PostgreSQL host.
