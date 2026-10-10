# docs/SECURITY.md — Security Design

**Owner:** This file. Security policy, authorization model, data protection and audit design.
**Last updated:** 2026-10-10 (revised per ADR-012: Supabase RLS replaced by server-side authorization)
**Stack context:** Local PostgreSQL + Prisma ORM + Better Auth. No Supabase Auth, no RLS, no anon/service roles.

---

## 1. Threat Model (High-Level)

| Threat | Mitigation |
|---|---|
| Unauthorized data access | Session cookie required; server-side role/ownership checks on every request |
| Price or role manipulation | Server owns all prices, roles and inventory counts; browser input is user intent only |
| Payment spoofing | Callbacks verified by provider signature; `PaymentEvent.eventId` unique constraint prevents replay |
| SQL injection | Prisma parameterized queries for all DB access; raw SQL only via tagged template literals |
| Path traversal (receipts) | `path.resolve()` validated against `UPLOAD_DIR` prefix before any file operation |
| Malicious file uploads | Extension allowlist + magic byte validation; MIME type check; size limit |
| Session fixation/hijacking | Better Auth issues new session on login; HttpOnly + SameSite cookie |
| Self-approval / self-payout | Service layer enforces: reviewer !== claimant; payer !== claimant; checked before DB write |
| Insider privilege escalation | Role assignment requires officer-level session; all role changes write AuditEvent |
| Demo payment misuse | Demo adapter disabled when `PAYMENT_MODE !== 'demo'`; responses visibly labelled |
| Secret leakage | No `NEXT_PUBLIC_` prefix on DATABASE_URL, BETTER_AUTH_SECRET, UPLOAD_DIR, job secret |
| Log injection | Structured logging only; user-supplied strings sanitized before log emission |
| CSRF | SameSite=Lax cookie prevents cross-site form submission; Better Auth defaults are correct |
| Job runner abuse | `POST /api/internal/jobs/run` requires `JOB_RUNNER_SECRET` header; not publicly reachable |

---

## 2. Authentication (Better Auth)

### Session Model

Better Auth manages session lifecycle. The session is stored in the `session` table (PostgreSQL) and referenced via an HttpOnly cookie.

| Property | Value |
|---|---|
| Session expiry | 7 days |
| Session renewal window | 1 day (refreshed if older than 1 day) |
| Cookie | HttpOnly; SameSite=Lax; Secure=true on HTTPS; Secure=false on localhost (auto-detected) |
| Session ID | Random string; stored as `token` field in `session` table |
| Password hashing | Handled by Better Auth internally (bcrypt or argon2 — do not implement manually) |

### Server-Side Session Validation

Every Route Handler and server component that requires authentication calls:

```typescript
const session = await auth.api.getSession({ headers: await headers() })
if (!session) throw new SkylineError("UNAUTHORIZED", "Authentication required", 401)
```

`getSessionCookie(request)` in middleware checks cookie presence only (fast path for route guards). Full DB validation must happen in the Route Handler.

### Password Security

Application code never reads or handles raw passwords. Better Auth's `Account.password` field stores the hash. Application code calls `auth.api.signInWithEmailAndPassword()` — never reads `account.password` directly.

### Rate Limiting

Better Auth rate limiter is enabled: 10 requests per IP per 60-second window on auth endpoints. A reverse proxy or Cloudflare should add additional rate limiting in hosted production.

### Email Verification

Email verification is disabled for the local demo (`requireEmailVerification: false`). This must be explicitly re-enabled before any production deployment.

---

## 3. Authorization Model

### Role Hierarchy

| Role | Who has it | Capabilities |
|---|---|---|
| Public visitor | Anyone | View published events, products, announcements |
| Authenticated student | Any logged-in user | Buy tickets/merch, submit claims, view own passes/orders |
| Active member | Student with active membership | Member-priced tickets and merch |
| Officer | Assigned via `role` table | Create/edit activities, manage tasks, manage stock, publish announcements |
| Treasurer | Assigned via `role` table | Review and pay claims, view full cashbook, record fundraiser receipts |
| Activity staff (check-in) | Assigned via `activity_staff` | Scan tickets for a specific activity only |
| Activity staff (volunteer) | Assigned via `activity_staff` | View task list for a specific activity only |

### Authorization Enforcement Points

All authorization is server-side, in Route Handlers and service functions. No database-level enforcement (PostgreSQL is accessible only from the Node.js process).

```typescript
// Helpers in lib/auth/session.ts
requireAuth()                          // 401 if no session
requireRole(session, 'officer')        // 403 if not officer
requireRole(session, 'treasurer')      // 403 if not treasurer
requireOwner(session, resource.userId) // 403 if not owner
requireActivityStaff(session, activityId, 'checkin')   // 403 if not assigned
requireActivityStaff(session, activityId, 'volunteer') // 403 if not assigned
```

### Authorization Rules by Feature

| Feature | Auth required | Role check |
|---|---|---|
| View published events/products/announcements | No | None |
| Buy ticket or merch | Yes | None (membership checked for pricing) |
| Renew membership | Yes | None |
| Submit reimbursement claim | Yes | None (own claim) |
| View own passes, orders, claims | Yes | Owner only |
| QR check-in scan | Yes | ActivityStaff(activityId, 'checkin') |
| View activity volunteer task list | Yes | ActivityStaff(activityId, 'volunteer') |
| Create/edit activity | Yes | Officer |
| Manage activity staff | Yes | Officer |
| Create/edit product variants | Yes | Officer |
| Publish announcement | Yes | Officer |
| Review/approve/reject claim | Yes | Treasurer |
| Record claim payout | Yes | Treasurer AND reviewer !== payer (enforced in service) |
| Record fundraiser receipt | Yes | Treasurer |
| View full cashbook | Yes | Officer or Treasurer |
| Generate handover snapshot | Yes | Officer |
| Assign officer/treasurer role | Yes | Officer |
| View uploaded receipt file | Yes | Owner or Treasurer |
| Trigger internal job | Server-to-server | JOB_RUNNER_SECRET header |

### Self-Approval and Self-Payout Protection

```typescript
// In ClaimService.approveClaim()
if (claim.claimantId === session.user.id) {
  throw new SkylineError("SELF_APPROVAL_FORBIDDEN", "Cannot approve own claim", 403)
}
// In ClaimService.recordPayout()
if (claim.claimantId === session.user.id || claim.reviewerId === session.user.id) {
  throw new SkylineError("SELF_PAYOUT_FORBIDDEN", "Cannot pay own or self-reviewed claim", 403)
}
// Write AuditEvent for all claim state changes
```

---

## 4. Data Protection

### Secret Classification

| Secret | Classification | Storage |
|---|---|---|
| `DATABASE_URL` | Server-only | `.env.local`; never `NEXT_PUBLIC_` |
| `BETTER_AUTH_SECRET` | Server-only | `.env.local`; minimum 32 random bytes |
| `BETTER_AUTH_URL` | Server URL | `.env.local`; same value as `NEXT_PUBLIC_APP_URL` |
| `RECEIPT_TOKEN_ENCRYPTION_KEY` | Server-only | `.env.local`; 32-byte hex for AES-256 |
| `JOB_RUNNER_SECRET` | Server-only | `.env.local` |
| `EMAIL_API_KEY` | Server-only | `.env.local` |
| `PAYMENT_PROVIDER_KEY` | Server-only | `.env.local` |
| `PAYMENT_WEBHOOK_SECRET` | Server-only | `.env.local` |
| `NEXT_PUBLIC_APP_URL` | Public | Can be exposed; no secret value |

### QR Ticket Token

Ticket token is a random 32-byte value:
1. Server generates `crypto.randomBytes(32)`.
2. Stored as `tokenHash = SHA-256(token)` in `tickets.tokenHash`.
3. Stored as `encryptedToken = AES-256-GCM(token, RECEIPT_TOKEN_ENCRYPTION_KEY)` in `tickets.encryptedToken`.
4. QR code contains only the encrypted token.
5. Check-in endpoint decrypts, hashes, and validates against `tokenHash`.
6. `checkedInAt` is set in a `FOR UPDATE` transaction — prevents double check-in.

### Receipt File Security

- Files stored at `UPLOAD_DIR/<random-uuid>.<ext>` — no user-supplied filename in path.
- Directory outside `public/` — not served by Next.js static file handler.
- Download endpoint streams file with `Content-Disposition: attachment`.
- Path traversal check: `path.resolve(UPLOAD_DIR, filename).startsWith(UPLOAD_DIR + path.sep)`.
- Magic byte validation prevents executable masquerading as image/PDF.
- Access gate: owner or treasurer only, verified in Route Handler before stream.

### Money and Financial Data

- All amounts stored as `BigInt` paise. No floating point.
- Confirmed cashbook entries: no DELETE or silent edit via application code.
- Purchases: no DELETE on confirmed records via application code.
- Handover snapshots: `snapshotJson` field is immutable after insert.

---

## 5. Input Validation

All inputs validated with Zod at the Route Handler level before reaching service functions:

```typescript
// Route handler pattern
const body = await request.json()
const parsed = CreateBookingSchema.safeParse(body)
if (!parsed.success) {
  return Response.json(
    { error: { code: "VALIDATION_ERROR", message: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors }, requestId },
    { status: 422 }
  )
}
// Only parsed.data reaches service functions
```

Prisma parameterized queries handle SQL safety. Raw SQL via tagged template literals only — no string interpolation.

---

## 6. Audit Trail

Every financial and authorization-changing action writes an `AuditEvent`:

| Event | Required fields |
|---|---|
| `MEMBERSHIP_ACTIVATED` | actorId, userId, periodId |
| `TICKET_ISSUED` | actorId, bookingId, activityId |
| `TICKET_CHECKED_IN` | actorId (staff), ticketId |
| `ORDER_CONFIRMED` | actorId, orderId |
| `CLAIM_SUBMITTED` | actorId, claimId |
| `CLAIM_APPROVED` | actorId (reviewer), claimId |
| `CLAIM_REJECTED` | actorId (reviewer), claimId, reviewNote |
| `CLAIM_PAID` | actorId (treasurer), claimId, payoutRef |
| `ROLE_ASSIGNED` | actorId (granting officer), targetUserId, role |
| `ROLE_REVOKED` | actorId, targetUserId, role |
| `DEMO_PAYMENT_CONFIRMED` | actorId, purchaseId (clearly labelled) |
| `RECONCILIATION_FLAGGED` | system, purchaseId, paymentAttemptId |
| `SNAPSHOT_GENERATED` | actorId, snapshotId |

`AuditEvent.safeMetadata` must never include: passwords, raw tokens, `storagePath`, full receipt content, PII beyond IDs and action context.

---

## 7. API Security Headers (Planned)

Set via Next.js `headers()` in `next.config.ts`:

```typescript
const securityHeaders = [
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "X-XSS-Protection",          value: "1; mode=block" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
  // Camera: explicitly allow for QR scanning page only via route-specific override
  // CSP: tighten in production; avoid unsafe-inline for scripts
]
```

---

## 8. No Supabase-Specific Security Features

The following Supabase-specific security features are NOT applicable to this setup and must NOT be referenced in implementation:

- `auth.uid()` PostgreSQL function
- `auth.jwt()` PostgreSQL function
- `auth.role()` PostgreSQL function
- Row-Level Security policies (`CREATE POLICY`, `ENABLE ROW LEVEL SECURITY`)
- Supabase anon / authenticated / service role PostgreSQL roles
- Supabase Storage access policies

All authorization is implemented in the Node.js application layer. If PostgreSQL RLS is desired as an additional layer of defence, it must be implemented using standard PostgreSQL mechanisms (e.g. `SET LOCAL` + a custom function) without Supabase-specific helpers.

---

## 9. Demo Security Posture

| Item | Demo setting | Production requirement |
|---|---|---|
| Email verification | Disabled | Enabled |
| HTTPS | Local HTTP (`http://localhost`) | Enforced |
| Demo payment | `PAYMENT_MODE=demo` — never contacts bank | `PAYMENT_MODE=live` |
| Demo-confirm endpoint | Enabled | Disabled / removed |
| PostgreSQL access | Loopback only (`127.0.0.1`) | Firewall / VPC restricted |
| Receipt encryption key | Demo key (change before production) | Unique, random, rotatable |
| Audit log | Written but not monitored | Monitored and retained |
| Rate limiting | Better Auth default | Reverse proxy + WAF |

---

## 10. Security Checklist (Pre-Demo / Pre-Release)

- [ ] `DATABASE_URL` not in any client bundle or committed file
- [ ] `BETTER_AUTH_SECRET` set, minimum 32 random bytes, not committed
- [ ] `RECEIPT_TOKEN_ENCRYPTION_KEY` set, 32-byte hex, not committed
- [ ] `.env.local` is in `.gitignore`
- [ ] Demo payment visibly labelled in UI; `PAYMENT_MODE=demo`
- [ ] Demo-confirm endpoint not accessible in production
- [ ] Receipt directory outside `public/`; content not browsable
- [ ] Magic byte validation present in upload handler
- [ ] Path traversal check present in download handler
- [ ] All audit event writes present for financial and role-change operations
- [ ] Self-approval and self-payout checks present in ClaimService
- [ ] Session validation present on every authenticated Route Handler
- [ ] PostgreSQL port 5432 not exposed to network (loopback binding)
- [ ] Security headers set in `next.config.ts`
