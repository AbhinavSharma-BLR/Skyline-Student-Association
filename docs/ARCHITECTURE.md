# docs/ARCHITECTURE.md — Technical Source of Truth

**Owner:** This file. Database schema, API contracts, transaction design and runtime architecture live here.
**Last updated:** 2026-10-10 | **Status:** Documentation revised — no code implemented.
**Stack change:** Supabase services replaced by local PostgreSQL + Prisma ORM + Better Auth + local filesystem storage.
See [ADR-012](./DECISIONS.md#adr-012).

See docs/PRD.md for requirements. See docs/SECURITY.md for security policy.

---

## 1. Architecture Overview

```
Browser
  |
  | HTTPS (cookies, session management)
  v
Next.js Route Handlers  (/api/v1/*)
  |          |
  |          +--> Better Auth handler (/api/auth/[...all])
  |               Sessions stored in PostgreSQL via Prisma
  v
Domain Services (lib/services/)
  |          |          |
  v          v          v
PostgreSQL   Local FS   Provider Adapters
(Prisma ORM) uploads/   (email, payment)

Background Job Runner (/api/internal/jobs/run + scheduler)
  v
Domain Services (same code path)
```

### What Changed vs. Supabase

| Concern | Previous (Supabase) | Current (Local) |
|---|---|---|
| Database server | Supabase-hosted PostgreSQL | Local PostgreSQL instance |
| Database client | Supabase JS client | Prisma ORM (Node.js runtime only) |
| Migrations | `supabase db push` | `prisma migrate dev/deploy` |
| Row-Level Security | Supabase RLS policies | Server-side authorization only |
| Auth | Supabase Auth (external) | Better Auth (inside Next.js app) |
| Auth storage | Supabase `auth.*` schema | `user/session/account/verification` via Prisma |
| Receipt storage | Supabase Storage bucket | Server-managed `uploads/` outside `public/` |
| Realtime | Not used | Not used |
| Edge Functions | Not used | Not applicable |

### Key Clarifications

- **PostgreSQL is the same engine.** Supabase ran PostgreSQL. We now self-manage it. SQL semantics, transactions, and constraints are identical.
- **Prisma is not the database.** Prisma is an ORM running in Node.js. It connects to PostgreSQL via `DATABASE_URL`.
- **Better Auth runs inside Next.js.** It is not a hosted service. It stores sessions and users in our PostgreSQL via Prisma.
- **Browser never touches PostgreSQL.** All access: Browser → Route Handler → Service → Prisma → PostgreSQL.
- **Local PostgreSQL does not affect email or payment gateways.** They remain external HTTP services.

### Layer Responsibilities

| Layer | Technology | Responsibility |
|---|---|---|
| Browser | React / Next.js | Render UI; never compute prices, roles or inventory |
| Route Handlers | Next.js App Router | Validate session; validate input; authorize; delegate |
| Better Auth handler | `/api/auth/[...all]` | Signup, login, logout, session, cookies |
| Domain Services | `lib/services/` | Business logic; transactions; provider calls |
| Prisma | `lib/prisma.ts` | Type-safe DB access; parameterized queries |
| PostgreSQL | Local server | Constraints, transactions, locks, financial data |
| Local FS | `uploads/receipts/` | Private receipt files; never statically served |
| Payment adapter | Interface + demo impl | createIntent / verifyCallback / fetchPayment |
| Email adapter | Interface + provider | send(job, idempotencyKey) |

---

## 2. Trust Boundaries

- Browser never sets: prices, roles, stock counts, membership status, payment confirmation.
- Auth state resolved server-side: `auth.api.getSession({ headers: await headers() })`.
- Provider callbacks verified by signature; independent of user sessions.
- Secrets never in client bundles: `DATABASE_URL`, `BETTER_AUTH_SECRET`, encryption key, webhook secrets.
- PostgreSQL bound to `127.0.0.1` only. Port 5432 never publicly exposed.

---

## 3. Repository Organization

```
project root/
├── app/
│   ├── (public)/          # /, /events, /membership, /merch, /updates, /about
│   ├── (auth)/            # /login, /signup
│   ├── (member)/me/       # Student workspace
│   ├── (desk)/desk/       # Officer/Treasurer workspace
│   └── api/
│       ├── auth/[...all]/ # Better Auth handler (GET + POST)
│       └── v1/            # Domain Route Handlers
│           └── internal/  # Job runner (JOB_RUNNER_SECRET)
├── components/
│   ├── ui/                # shadcn/ui primitives
│   └── domain/            # Skyline-specific domain components
├── lib/
│   ├── auth/              # Better Auth instance + capability checks
│   ├── prisma.ts          # Singleton Prisma client
│   ├── schemas/           # Zod schemas; shared enums
│   ├── services/          # Domain business logic
│   └── providers/         # Payment and email adapter interfaces
├── prisma/
│   ├── schema.prisma      # Auth models + domain models (single file)
│   └── migrations/        # Prisma-managed history (committed)
├── uploads/               # Private receipts (outside public/; gitignored content)
├── tests/
│   ├── integration/       # DB state, transactions, concurrency, authorization
│   └── e2e/               # Core browser journey
├── docs/
├── .agents/
├── .env.example           # Placeholders only
├── brain.md
├── AGENTS.md
└── README.md
```

---

## 4. Authentication Design (Better Auth + Prisma)

### Auth Instance

```typescript
// lib/auth/auth.ts
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,  // disabled for local demo; enable for production
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,  // 7 days
    updateAge:  60 * 60 * 24,       // refresh window: 1 day
  },
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL!],
  rateLimit: { enabled: true, window: 60, max: 10 },
})
```

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth/auth"
import { toNextJsHandler } from "better-auth/next-js"
export const { GET, POST } = toNextJsHandler(auth)
```

### User ID Type

**Better Auth generates `String` IDs** — not PostgreSQL UUIDs. All domain tables reference auth users via `String` foreign keys, not `UUID`. Domain models use `@default(cuid())` for consistency.

### Session Validation

```typescript
// lib/auth/session.ts
import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"

export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new SkylineError("UNAUTHORIZED", "Authentication required", 401)
  return session  // { user: { id, email, name }, session: { ... } }
}

export async function requireRole(
  session: Awaited<ReturnType<typeof requireAuth>>,
  role: "officer" | "treasurer"
) {
  const r = await prisma.role.findFirst({ where: { userId: session.user.id, role } })
  if (!r) throw new SkylineError("FORBIDDEN", "Insufficient role", 403)
}
```

### Middleware (Cookie-based Route Guard)

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)
  const { pathname } = request.nextUrl
  if (!sessionCookie && (pathname.startsWith("/me") || pathname.startsWith("/desk"))) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  return NextResponse.next()
}
export const config = { matcher: ["/me/:path*", "/desk/:path*"] }
```

> `getSessionCookie` checks cookie presence only (fast, no DB). Full session + role validation in Route Handlers via `auth.api.getSession()`.

### Auth Table Models (Prisma — Better Auth Managed)

Generate with: `npx @better-auth/cli generate --output ./prisma/schema.prisma`

```prisma
model User {
  id            String    @id          // String, not UUID
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  accounts      Account[]
  profile       Profile?
  roles         Role[]
  @@map("user")
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@map("session")
}

model Account {
  id          String   @id
  accountId   String
  providerId  String
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  password    String?  // hashed by Better Auth; application code never reads this
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([userId])
  @@map("account")
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@index([identifier])
  @@map("verification")
}
```

### Cookie Behaviour

| Environment | Behaviour |
|---|---|
| Local `http://localhost` | `SameSite=Lax`; `Secure=false` (Better Auth auto-detects) |
| Deployed HTTPS | `SameSite=Lax`; `Secure=true`; `HttpOnly=true` |

Do not set `Secure=false` globally. Better Auth defaults are correct per environment.

### Role Concepts

| Concept | Storage | Notes |
|---|---|---|
| Account | `user` + `account` tables | Created at signup |
| Profile | `profile` table | Name, studentId, phone |
| Active membership | `membership` table | Dues paid for current period |
| Officer | `role` (role=`officer`) | Assigned by owner officer; audited |
| Treasurer | `role` (role=`treasurer`) | Assigned by owner officer; audited |
| Activity staff | `activity_staff` | Scoped to activity; `checkin` or `volunteer` |

Public signup cannot assign any role. Roles assigned via seed or controlled assignment endpoint only.

### Email Verification

For local demo, `requireEmailVerification: false`. State this explicitly — do not display unverified addresses as verified. A local test inbox (Mailpit/Mailhog) demonstrates verification flows; it does not prove delivery to real inboxes.

---

## 5. Local PostgreSQL Setup

### Option A — Native Installation (Recommended if no Docker)

```bash
# Windows: https://www.postgresql.org/download/windows/
# macOS:   brew install postgresql@16
# Linux:   sudo apt install postgresql-16

psql -U postgres -c "CREATE USER skyline_app WITH PASSWORD 'change-in-dev';"
psql -U postgres -c "CREATE DATABASE skyline_dev  OWNER skyline_app;"
psql -U postgres -c "CREATE DATABASE skyline_test OWNER skyline_app;"
psql -U postgres -c "ALTER USER skyline_app CREATEDB;"  # required for prisma migrate dev
```

### Option B — Docker (if already available)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: skyline_app
      POSTGRES_PASSWORD: change-in-dev
      POSTGRES_DB: skyline_dev
    ports:
      - "127.0.0.1:5432:5432"   # loopback only
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```

Do not introduce Docker as a mandatory dependency if the team does not already use it.

### Database URLs

```env
DATABASE_URL="postgresql://skyline_app:change-in-dev@127.0.0.1:5432/skyline_dev"
DATABASE_URL_TEST="postgresql://skyline_app:change-in-dev@127.0.0.1:5432/skyline_test"
```

### Migration Workflow (Planned)

```bash
npx prisma migrate dev --name <descriptive-name>  # dev: creates file + applies
npx prisma migrate deploy                          # demo/prod: applies existing only
npx prisma migrate reset                           # dev: drop, recreate, reseed (WARNING: destructive)
npx prisma studio                                  # local schema inspection UI
```

### Seed (Planned)

```bash
npm run db:seed   # Runs prisma/seed.ts
```

Creates: demo accounts (student, officer, treasurer, door staff), club settings, demo membership period, demo activity.

### Backup (Planned)

```bash
pg_dump  -U skyline_app -F c skyline_dev  > backup_$(date +%Y%m%d).dump
pg_restore -U skyline_app -d skyline_dev    backup_YYYYMMDD.dump
tar -czf uploads_$(date +%Y%m%d).tar.gz uploads/   # back up receipts too
```

### Per-Teammate Setup

Each teammate runs their own local PostgreSQL with identical migrations and seed data. Databases do not auto-sync. The **designated demo machine** holds the authoritative demo dataset. Agree before jury presentation.

### Connection Troubleshooting

| Problem | Check |
|---|---|
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL service not running |
| `role "skyline_app" does not exist` | Re-run user creation SQL |
| Migration state mismatch | Check `_prisma_migrations`; use `prisma migrate resolve` |
| Port 5432 in use | `lsof -i :5432` — another instance running |

---

## 6. Provider Adapters (Unchanged)

```typescript
interface PaymentProvider {
  createIntent(purchase: Purchase, idempotencyKey: string): Promise<PaymentIntent>
  verifyCallback(rawBody: Buffer, headers: Record<string, string>): Promise<VerifiedEvent>
  fetchPayment(reference: string): Promise<PaymentStatus>
}
// Demo adapter: always returns DEMO_CONFIRMED; visibly labelled; disabled in production.

interface EmailProvider {
  send(job: EmailJob, idempotencyKey: string): Promise<{ messageId: string } | RetryableError | PermanentError>
}
```

---

## 7. Background Jobs (Unchanged)

| Job | Trigger | Frequency |
|---|---|---|
| `expire_reservations` | Scheduler | Every minute |
| `renewal_reminders` | Scheduler | Daily |
| `send_email_jobs` | Scheduler | Every minute |
| `retry_failed_emails` | Scheduler | Backoff, max 5 attempts |

Triggered via `POST /api/internal/jobs/run` authenticated with `JOB_RUNNER_SECRET`.

---

## 8. Local File Storage (Receipts)

```env
UPLOAD_DIR=/absolute/path/outside/project/uploads/receipts
MAX_UPLOAD_BYTES=5242880
```

**Upload flow:**
1. `POST /api/v1/claims/upload-intent` (authenticated).
2. Validate: extension allowlist (`.jpg`, `.jpeg`, `.png`, `.pdf`), size <= 5 MB.
3. Validate file magic bytes: JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), PDF (`25 50 44 46`).
4. Generate randomized filename: `crypto.randomUUID() + .ext`.
5. Write to `UPLOAD_DIR/<uuid>.ext`.
6. Store `{ userId, storagePath, mimeType, sizeBytes }` in `receipt_files` table.

**Download flow:**
1. `GET /api/v1/claims/:id/receipt` (authenticated).
2. Check: caller is claim owner OR authorized treasurer.
3. Read `receiptFile.storagePath` from DB. Stream file with `Content-Disposition: attachment`.
4. Filesystem paths never exposed to browser.

**Path traversal prevention:**
```typescript
const resolved = path.resolve(UPLOAD_DIR, filename)
if (!resolved.startsWith(UPLOAD_DIR + path.sep)) throw new Error("PATH_TRAVERSAL")
```

**Persistence warning:** Local filesystem requires a persistent disk. Ephemeral/serverless deployments lose files on restart. Use a persistent-disk server or mounted volume for the demo machine.

Product images: public; separate directory from private receipts.

---

## 9. Deployment Architecture

### Local Demo (Hackathon)

```
Demo machine running:
  - Node.js process (next dev or next start)
  - PostgreSQL (native install or Docker)
  - uploads/ on persistent local disk

Jury devices -> local network IP:3000
PostgreSQL port 5432 NOT exposed to network
```

### Future Hosted Deployment

```
VPS or container host with:
  - Node.js runtime (not serverless/Edge — DB and files require persistent connections)
  - PostgreSQL on same host or reachable managed instance
  - Persistent volume for uploads/
  - Reverse proxy (nginx/Caddy) for HTTPS
  - External cron for background jobs
```

> WARNING: Vercel serverless functions cannot reach localhost PostgreSQL and have ephemeral filesystems. Hosted deployment requires Railway, Fly.io, Render, VPS or similar.

---

## 10. Prisma Schema Specification

### Conventions

- All IDs: `String`. Better Auth user IDs are Strings. Domain models use `@default(cuid())`.
- Timestamps: `DateTime` (UTC). Displayed in Asia/Kolkata by the app.
- Money: `BigInt` in Prisma (integer paise, INR). No floating point.
- Enum-like string fields constrained via custom SQL `CHECK` constraints (Prisma cannot express these natively).
- No hard-delete on confirmed purchases, cashbook entries or snapshots.

### Domain Models

```prisma
model Profile {
  id        String   @id @default(cuid())
  userId    String   @unique
  fullName  String
  studentId String?  @unique
  phone     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("profiles")
}

model Role {
  id        String   @id @default(cuid())
  userId    String
  role      String   // CHECK: 'officer' | 'treasurer'
  grantedBy String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, role])
  @@map("roles")
}

model MembershipPeriod {
  id          String   @id @default(cuid())
  label       String
  startsAt    DateTime
  endsAt      DateTime
  duesPaise   BigInt   // CHECK >= 0; endsAt > startsAt enforced via SQL
  isCurrent   Boolean  @default(false)
  createdAt   DateTime @default(now())
  memberships Membership[]
  @@map("membership_periods")
}

model Membership {
  id        String   @id @default(cuid())
  userId    String
  periodId  String
  status    String   @default("pending")  // CHECK: 'pending'|'active'|'cancelled'
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  period    MembershipPeriod @relation(fields: [periodId], references: [id])
  purchase  Purchase?
  @@unique([userId, periodId])
  @@map("memberships")
}

model ClubSettings {
  id                  String   @id @default(cuid())
  name                String   @default("Skyline Student Association")
  openingBalancePaise BigInt   @default(0)
  openingBalanceAt    DateTime
  timezone            String   @default("Asia/Kolkata")
  renewalLeadDays     Int      @default(14)
  @@map("club_settings")
}

model Activity {
  id                String    @id @default(cuid())
  kind              String    // CHECK: 'event'|'fundraiser'
  title             String
  description       String?
  startsAt          DateTime?
  venue             String?
  published         Boolean   @default(false)
  ticketed          Boolean   @default(false)
  capacity          Int?
  memberPricePaise  BigInt?
  regularPricePaise BigInt?
  createdById       String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  staff             ActivityStaff[]
  bookings          Booking[]
  tasks             Task[]
  claims            Claim[]
  fundraiserReceipts FundraiserReceipt[]
  announcements     Announcement[]
  @@map("activities")
}

model ActivityStaff {
  id         String   @id @default(cuid())
  activityId String
  userId     String
  capability String   // CHECK: 'checkin'|'volunteer'
  activity   Activity @relation(fields: [activityId], references: [id])
  @@unique([activityId, userId, capability])
  @@map("activity_staff")
}

model Booking {
  id            String   @id @default(cuid())
  activityId    String
  userId        String
  reservedUntil DateTime
  createdAt     DateTime @default(now())
  activity      Activity  @relation(fields: [activityId], references: [id])
  ticket        Ticket?
  purchase      Purchase?
  @@unique([activityId, userId])
  @@map("bookings")
}

model Ticket {
  id             String    @id @default(cuid())
  bookingId      String    @unique
  tokenHash      String    @unique
  encryptedToken String
  checkedInAt    DateTime?
  checkedInById  String?
  createdAt      DateTime  @default(now())
  booking        Booking   @relation(fields: [bookingId], references: [id])
  @@map("tickets")
}

model Product {
  id                String   @id @default(cuid())
  name              String
  description       String?
  imagePath         String?
  active            Boolean  @default(true)
  regularPricePaise BigInt
  memberPricePaise  BigInt
  createdById       String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  variants          Variant[]
  @@map("products")
}

model Variant {
  id            String   @id @default(cuid())
  productId     String
  size          String
  stockTotal    Int      @default(0)   // CHECK >= 0
  stockReserved Int      @default(0)   // CHECK >= 0
  stockSold     Int      @default(0)   // CHECK >= 0; reserved+sold <= total enforced via SQL
  product       Product  @relation(fields: [productId], references: [id])
  orderItems    OrderItem[]
  @@unique([productId, size])
  @@map("variants")
}

model Order {
  id            String   @id @default(cuid())
  userId        String
  reservedUntil DateTime
  fulfilment    String   @default("pending")  // CHECK: 'pending'|'ready'|'collected'
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  items         OrderItem[]
  purchase      Purchase?
  @@map("orders")
}

model OrderItem {
  id             String   @id @default(cuid())
  orderId        String
  variantId      String
  quantity       Int      // CHECK > 0
  unitPricePaise BigInt   // immutable after creation
  createdAt      DateTime @default(now())
  order          Order    @relation(fields: [orderId], references: [id])
  variant        Variant  @relation(fields: [variantId], references: [id])
  @@map("order_items")
}

model Purchase {
  id            String   @id @default(cuid())
  userId        String
  membershipId  String?  @unique
  bookingId     String?  @unique
  orderId       String?  @unique
  amountPaise   BigInt   // CHECK >= 0
  currency      String   @default("INR")
  state         String   @default("pending")  // CHECK: 'pending'|'confirmed'|'expired'|'cancelled'
  pricingBasis  String   // CHECK: 'active_member'|'regular'|'dues'
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  membership    Membership?    @relation(fields: [membershipId], references: [id])
  booking       Booking?       @relation(fields: [bookingId], references: [id])
  order         Order?         @relation(fields: [orderId], references: [id])
  paymentAttempts PaymentAttempt[]
  @@map("purchases")
}

model PaymentAttempt {
  id                    String    @id @default(cuid())
  purchaseId            String
  provider              String
  providerRef           String?   // partial unique via SQL WHERE providerRef IS NOT NULL
  amountPaise           BigInt    // CHECK > 0
  state                 String    @default("pending")  // CHECK: 'pending'|'confirmed'|'failed'
  confirmedAt           DateTime?
  reconciliationRequired Boolean  @default(false)
  createdAt             DateTime  @default(now())
  purchase              Purchase  @relation(fields: [purchaseId], references: [id])
  cashbookEntries       CashbookEntry[]
  @@map("payment_attempts")
}

model PaymentEvent {
  id          String   @id @default(cuid())
  provider    String
  eventId     String
  payloadHash String
  processedAt DateTime
  outcome     String
  @@unique([provider, eventId])
  @@map("payment_events")
}

model Task {
  id         String    @id @default(cuid())
  activityId String
  title      String
  assigneeId String?
  dueAt      DateTime?
  status     String    @default("todo")  // CHECK: 'todo'|'in_progress'|'done'
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  activity   Activity  @relation(fields: [activityId], references: [id])
  @@map("tasks")
}

model Claim {
  id            String    @id @default(cuid())
  claimantId    String
  activityId    String?
  amountPaise   BigInt    // CHECK > 0
  reason        String
  status        String    @default("submitted")  // CHECK: 'submitted'|'approved'|'rejected'|'paid'
  reviewerId    String?
  reviewNote    String?
  payoutRef     String?
  paidAt        DateTime?
  parentClaimId String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  activity      Activity?    @relation(fields: [activityId], references: [id])
  receiptFile   ReceiptFile?
  cashbookEntries CashbookEntry[]
  @@map("claims")
}

model ReceiptFile {
  id          String   @id @default(cuid())
  claimId     String?  @unique
  userId      String
  storagePath String   // server-side randomized path; never exposed to browser
  mimeType    String
  sizeBytes   Int
  createdAt   DateTime @default(now())
  claim       Claim?   @relation(fields: [claimId], references: [id])
  @@map("receipt_files")
}

model FundraiserReceipt {
  id           String   @id @default(cuid())
  activityId   String
  amountPaise  BigInt   // CHECK > 0
  reference    String   @unique
  recordedById String
  createdAt    DateTime @default(now())
  activity     Activity @relation(fields: [activityId], references: [id])
  cashbookEntries CashbookEntry[]
  @@map("fundraiser_receipts")
}

model CashbookEntry {
  id                  String   @id @default(cuid())
  direction           String   // CHECK: 'INFLOW'|'OUTFLOW'
  category            String   // 'dues'|'ticket'|'merch'|'fundraiser_cash'|'claim_payout'|'unresolved_payment'
  amountPaise         BigInt   // CHECK > 0
  paymentAttemptId    String?
  claimId             String?
  fundraiserReceiptId String?
  recordedById        String?
  occurredAt          DateTime
  createdAt           DateTime @default(now())
  paymentAttempt      PaymentAttempt?    @relation(fields: [paymentAttemptId], references: [id])
  claim               Claim?             @relation(fields: [claimId], references: [id])
  fundraiserReceipt   FundraiserReceipt? @relation(fields: [fundraiserReceiptId], references: [id])
  // Exactly-one-source enforced via custom SQL CHECK constraint
  @@map("cashbook_entries")
}

model Announcement {
  id          String    @id @default(cuid())
  activityId  String?
  title       String
  body        String
  audience    String    // CHECK: 'public'|'members'
  authorId    String
  publishedAt DateTime?
  updatedAt   DateTime  @updatedAt
  activity    Activity? @relation(fields: [activityId], references: [id])
  emailJobs   EmailJob[]
  @@map("announcements")
}

model EmailJob {
  id            String    @id @default(cuid())
  recipientId   String
  kind          String    // 'announcement'|'renewal_reminder'
  sourceKey     String
  state         String    @default("queued")  // 'queued'|'sent'|'failed'|'terminal'
  attempts      Int       @default(0)
  nextAttemptAt DateTime?
  leaseUntil    DateTime?
  providerId    String?
  createdAt     DateTime  @default(now())
  @@unique([recipientId, kind, sourceKey])
  @@map("email_jobs")
}

model AuditEvent {
  id           String   @id @default(cuid())
  actorId      String?
  action       String
  entityType   String
  entityId     String
  safeMetadata Json?
  createdAt    DateTime @default(now())
  @@map("audit_events")
}

model IdempotencyRecord {
  id          String   @id @default(cuid())
  actorId     String
  operation   String
  key         String
  requestHash String
  status      String
  response    Json?
  createdAt   DateTime @default(now())
  @@unique([actorId, operation, key])
  @@map("idempotency_records")
}

model HandoverSnapshot {
  id            String   @id @default(cuid())
  generatedById String
  generatedAt   DateTime @default(now())
  schemaVersion Int      @default(1)
  snapshotJson  Json     // immutable after insert; no app-level UPDATE on this field
  notes         String?
  @@map("handover_snapshots")
}
```

### Check Constraints via Custom SQL Migration

Prisma cannot express PostgreSQL CHECK constraints natively. Add a custom migration file:

```sql
-- prisma/migrations/YYYYMMDD_domain_constraints/migration.sql
ALTER TABLE memberships ADD CONSTRAINT chk_membership_status
  CHECK (status IN ('pending','active','cancelled'));
ALTER TABLE membership_periods ADD CONSTRAINT chk_period_dates
  CHECK ("endsAt" > "startsAt");
ALTER TABLE activities ADD CONSTRAINT chk_activity_kind
  CHECK (kind IN ('event','fundraiser'));
ALTER TABLE variants ADD CONSTRAINT chk_stock_nonneg
  CHECK ("stockTotal" >= 0 AND "stockReserved" >= 0 AND "stockSold" >= 0);
ALTER TABLE variants ADD CONSTRAINT chk_stock_consistency
  CHECK ("stockReserved" + "stockSold" <= "stockTotal");
ALTER TABLE purchases ADD CONSTRAINT chk_purchase_state
  CHECK (state IN ('pending','confirmed','expired','cancelled'));
ALTER TABLE purchases ADD CONSTRAINT chk_pricing_basis
  CHECK ("pricingBasis" IN ('active_member','regular','dues'));
ALTER TABLE purchases ADD CONSTRAINT chk_amount_nonneg CHECK ("amountPaise" >= 0);
ALTER TABLE payment_attempts ADD CONSTRAINT chk_payment_state
  CHECK (state IN ('pending','confirmed','failed'));
ALTER TABLE payment_attempts ADD CONSTRAINT chk_payment_amount_pos CHECK ("amountPaise" > 0);
ALTER TABLE claims ADD CONSTRAINT chk_claim_status
  CHECK (status IN ('submitted','approved','rejected','paid'));
ALTER TABLE claims ADD CONSTRAINT chk_claim_amount_pos CHECK ("amountPaise" > 0);
ALTER TABLE claims ADD CONSTRAINT chk_paid_requires_ref
  CHECK (status <> 'paid' OR ("payoutRef" IS NOT NULL AND "paidAt" IS NOT NULL));
ALTER TABLE cashbook_entries ADD CONSTRAINT chk_cashbook_direction
  CHECK (direction IN ('INFLOW','OUTFLOW'));
ALTER TABLE cashbook_entries ADD CONSTRAINT chk_cashbook_amount_pos CHECK ("amountPaise" > 0);
ALTER TABLE cashbook_entries ADD CONSTRAINT chk_cashbook_one_source CHECK (
  (CASE WHEN "paymentAttemptId"    IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN "claimId"             IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN "fundraiserReceiptId" IS NOT NULL THEN 1 ELSE 0 END) = 1
);
ALTER TABLE roles ADD CONSTRAINT chk_role_value CHECK (role IN ('officer','treasurer'));
ALTER TABLE activity_staff ADD CONSTRAINT chk_capability CHECK (capability IN ('checkin','volunteer'));
ALTER TABLE tasks ADD CONSTRAINT chk_task_status CHECK (status IN ('todo','in_progress','done'));
ALTER TABLE announcements ADD CONSTRAINT chk_audience CHECK (audience IN ('public','members'));
ALTER TABLE order_items ADD CONSTRAINT chk_quantity_pos CHECK (quantity > 0);
-- Partial unique for payment provider ref
CREATE UNIQUE INDEX idx_payment_unique_provider_ref
  ON payment_attempts(provider, "providerRef")
  WHERE "providerRef" IS NOT NULL;
```

### Essential Indexes

```sql
CREATE INDEX idx_bookings_activity_expiry ON bookings("activityId", "reservedUntil");
CREATE INDEX idx_orders_expiry ON orders("reservedUntil");
CREATE INDEX idx_purchases_state_user ON purchases(state, "userId");
CREATE INDEX idx_tasks_assignee_status ON tasks("assigneeId", status, "dueAt");
CREATE INDEX idx_claims_status_claimant ON claims(status, "claimantId");
CREATE INDEX idx_cashbook_occurred ON cashbook_entries("occurredAt", category);
CREATE INDEX idx_email_jobs_state ON email_jobs(state, "nextAttemptAt");
CREATE INDEX idx_audit_entity ON audit_events("entityType", "entityId", "createdAt");
CREATE INDEX idx_payment_purchase ON payment_attempts("purchaseId");
CREATE INDEX idx_order_items_variant ON order_items("variantId");
```

---

## 11. Authorization Boundary (Replaces Supabase RLS)

Supabase RLS (`auth.uid()`, anon/service roles) does not apply here. Authorization is enforced entirely by the application server:

1. Every Route Handler calls `requireAuth()` → 401 if absent.
2. Service functions receive an actor and check ownership, role and activity scope.
3. Prisma uses a single `skyline_app` DB user (not superuser).
4. PostgreSQL bound to `127.0.0.1`; port 5432 never publicly exposed.
5. Optional defence-in-depth: PostgreSQL RLS with `SET LOCAL app.current_user_id = $1` per transaction (do not use Supabase-specific functions).

Authorization helpers: `requireAuth()` · `requireRole(session, role)` · `requireOwner(session, userId)` · `requireActivityStaff(session, activityId, capability)`

---

## 12. Transaction and Concurrency Design

### Prisma $transaction with Row Locks

```typescript
// Ticket reservation
await prisma.$transaction(async (tx) => {
  const [act] = await tx.$queryRaw`
    SELECT id, capacity FROM activities WHERE id = ${activityId} FOR UPDATE
  `
  const occupied = await tx.booking.count({ where: { activityId, ... } })
  if (occupied >= act.capacity) throw new SkylineError("SOLD_OUT", ...)
  await tx.booking.create({ data: { ... } })
  await tx.purchase.create({ data: { ... } })
}, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

// Variant reservation — lock in sorted ID order (deadlock prevention)
await prisma.$transaction(async (tx) => {
  const variants = await tx.$queryRaw`
    SELECT id, "stockTotal", "stockReserved", "stockSold"
    FROM variants WHERE id = ANY(${variantIds}::text[])
    ORDER BY id FOR UPDATE
  `
  // Verify availability; increment stockReserved; create order + purchase
})
```

### Idempotent Reservation Expiry

```typescript
const result = await prisma.purchase.updateMany({
  where: { id, state: "pending" },
  data:  { state: "expired" },
})
// Decrement counters only if result.count > 0
```

### External Calls Outside Transactions

Do not call email or payment providers inside a DB transaction.
Pattern: transaction → record intent → commit → call provider → on failure, retry job picks it up.

### Failure Scenarios

| Failure | Recovery |
|---|---|
| User closes tab | Hold expires via expiry job |
| Gateway confirms, response lost | Retry: `PaymentEvent.eventId` unique constraint |
| DB unavailable during callback | Provider retries; no false local success |
| Email provider fails | Job persisted; retry with backoff |

---

## 13. Supabase Dependency Replacement Table

| Supabase Dependency | Status | Replacement |
|---|---|---|
| `@supabase/supabase-js` | Never implemented | `@prisma/client` + `better-auth` |
| `supabase.auth.getUser()` | Never implemented | `auth.api.getSession({ headers })` |
| `auth.users` schema | Never implemented | Better Auth `user` table in Prisma schema |
| `auth.uid()` / `auth.jwt()` RLS | Never implemented | Server-side `session.user.id` |
| Supabase anon key | Never implemented | Not applicable |
| Supabase service role key | Never implemented | Prisma `skyline_app` DB user |
| `NEXT_PUBLIC_SUPABASE_URL` | Never implemented | Remove from plans |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Never implemented | Remove from plans |
| `SUPABASE_SERVICE_ROLE_KEY` | Never implemented | Remove from plans |
| Supabase Storage buckets | Never implemented | `uploads/receipts/` local directory |
| Supabase Storage signed URLs | Never implemented | `GET /api/v1/claims/:id/receipt` streams file |
| `supabase/migrations/` directory | Never implemented | `prisma/migrations/` |
| `npx supabase db push` | Never implemented | `npx prisma migrate deploy` |
| `npx supabase start` | Never implemented | Native PostgreSQL or Docker |
| Supabase Edge Functions | Never used | Not applicable |
| Supabase Realtime | Never used | Not applicable |
| Supabase scheduled jobs | Never used | External cron → `/api/internal/jobs/run` |

Finding: Repository is documentation-only. No Supabase client code exists. This change is a documentation update only. No data or code migration required.

---

## 14. Financial Formulas (Unchanged)

```
Recorded balance at T =
  openingBalancePaise
  + SUM(cashbook_entries.amountPaise WHERE direction='INFLOW' AND occurredAt <= T)
  - SUM(cashbook_entries.amountPaise WHERE direction='OUTFLOW' AND occurredAt <= T)
```

All arithmetic in BigInt paise. No floating point.

---

## 15. API Contract (Unchanged from Prior Design)

Base path: `/api/v1`. Better Auth handles `/api/auth/*` automatically.
Format: JSON UTF-8. Money: integer paise. Timestamps: UTC ISO 8601.
Success: `{ "data": ... }`. Error: `{ "error": { "code", "message", "fieldErrors?" }, "requestId" }`.
Pagination: cursor-based (createdAt + id), limit 1-50.

Key differences from Supabase version:
- Auth endpoints at `/api/auth/*` handled by `toNextJsHandler(auth)` — not custom routes.
- Receipt download: `GET /api/v1/claims/:id/receipt` streams from local FS — no signed URL.
- No Supabase client initialization in any route.

---

## 16. Handover Snapshot (Unchanged)

Generated inside `prisma.$transaction({ isolationLevel: Serializable })`. Stored as immutable `Json` in `handover_snapshots.snapshotJson`. No application-level UPDATE on `snapshotJson` after insert.
