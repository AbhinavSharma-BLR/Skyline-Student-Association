# .agents/rules/security.md — Security Obligations

**Stack:** Local PostgreSQL + Prisma + Better Auth. No Supabase Auth, no RLS.
**Applies to:** All code in the project.

---

## Hard Rules — Never Violate

1. **No `NEXT_PUBLIC_` prefix on secrets.** `DATABASE_URL`, `BETTER_AUTH_SECRET`, `UPLOAD_DIR`, `EMAIL_API_KEY`, `PAYMENT_PROVIDER_KEY`, `PAYMENT_WEBHOOK_SECRET`, `JOB_RUNNER_SECRET`, `RECEIPT_TOKEN_ENCRYPTION_KEY` are server-only variables.
2. **Session validation on every authenticated endpoint.** Call `requireAuth()` as the first statement in every authenticated Route Handler.
3. **No Supabase client, auth functions or RLS.** `createClient`, `auth.uid()`, `auth.jwt()`, `ENABLE ROW LEVEL SECURITY`, `CREATE POLICY` must not appear in any file.
4. **No floating point money.** Money is `BigInt` paise throughout the codebase.
5. **No direct `account.password` reads.** Application code never reads or writes raw passwords. Better Auth handles this.
6. **Self-approval and self-payout are forbidden.** The service layer enforces this before any DB write.
7. **Demo payment endpoints disabled in production.** Guard with `if (process.env.PAYMENT_MODE !== 'demo') return 404`.
8. **File uploads: magic byte validation required.** Extension allowlist alone is insufficient.
9. **Path traversal check required.** `path.resolve(UPLOAD_DIR, filename).startsWith(UPLOAD_DIR + path.sep)` before any file read/write.
10. **No raw SQL string concatenation.** Only tagged template literals or `Prisma.sql` for raw queries.

---

## Authorization Checklist (Per Feature)

Before considering any feature implementation complete, verify:
- [ ] Session check present (`requireAuth()`)
- [ ] Role check present if officer/treasurer feature
- [ ] Ownership check present if user-scoped resource
- [ ] Activity staff check present if activity-scoped feature
- [ ] Self-approval / self-payout guard present in claim workflow
- [ ] AuditEvent written for financial and role-change operations
- [ ] Response does not expose: `storagePath`, `account.password`, session tokens, full `safeMetadata` objects

---

## Input Validation Checklist

- [ ] All Route Handler inputs validated with Zod before reaching service functions
- [ ] File uploads: extension, magic bytes, MIME type, size limit all checked
- [ ] Numeric inputs: range checked (non-negative amounts, positive quantities)
- [ ] String inputs: length bounds set (prevent excessively long strings)
- [ ] Cursor pagination inputs: validated as valid cuid strings before DB query

---

## Secret Handling

```typescript
// CORRECT — read from environment at server startup
const secret = process.env.BETTER_AUTH_SECRET
if (!secret) throw new Error("BETTER_AUTH_SECRET is required")

// WRONG — hardcoded secret
const secret = "my-secret-key-123"

// WRONG — secret in client bundle
export const config = { apiKey: process.env.SUPABASE_ANON_KEY }  // do not use
```

Fail fast on missing required environment variables. Add startup validation in a server-only initialization file (e.g., `lib/env.ts`).

---

## Audit Events

Write an `AuditEvent` for every:
- Financial state change (purchase confirmed, claim paid, fundraiser receipt recorded)
- Authorization change (role assigned, role revoked)
- Access-gated action (ticket check-in, receipt download)
- Anomaly (reconciliation flagged, demo payment used)

`AuditEvent.safeMetadata` must not contain: passwords, session tokens, storage paths, PII beyond IDs.

---

## Observability vs Security

```typescript
// CORRECT — log error code only
console.error("[SERVICE_ERROR]", { code: error.code, requestId })

// WRONG — log sensitive data
console.error("[ERROR]", { userId, email, claimReason, storagePath })
```

Structured logging only. User-supplied strings must be sanitized before log emission.

---

## No Supabase Security Features

The following must NOT appear anywhere in the codebase:

```sql
-- WRONG
ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own data" ON profiles ...;
auth.uid()
auth.jwt()
```

```typescript
// WRONG
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
```

Authorization is entirely in the Node.js application layer.

---

## Pre-Demo Security Checklist

- [ ] `.env.local` is in `.gitignore` and not committed
- [ ] No secret values appear in any committed file
- [ ] Demo payment endpoint guarded by `PAYMENT_MODE=demo` check
- [ ] Receipt directory outside `public/`
- [ ] Magic byte validation in upload handler
- [ ] Path traversal check in download handler
- [ ] `BETTER_AUTH_SECRET` is non-empty and at least 32 characters
- [ ] PostgreSQL bound to `127.0.0.1` (not `0.0.0.0`)
- [ ] Security headers set in `next.config.ts`
- [ ] All required environment variables present before app starts
