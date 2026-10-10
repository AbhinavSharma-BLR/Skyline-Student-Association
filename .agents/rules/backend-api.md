# .agents/rules/backend-api.md — Route Handler and Service Obligations

**Stack:** Next.js Route Handlers (Node.js runtime) + Better Auth + Prisma + Zod.
**Applies to:** All files in `app/api/v1/`, `app/api/auth/`, `lib/services/`, `lib/providers/`.

> IMPORTANT: No Supabase client, no Supabase Auth, no RLS. Authentication via Better Auth only. DB access via Prisma only.

---

## 1. Route Handler Structure

```typescript
// app/api/v1/bookings/route.ts
import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/auth/session"
import { CreateBookingSchema } from "@/lib/schemas/bookings"
import { BookingService } from "@/lib/services/BookingService"
import { handleApiError } from "@/lib/api/errors"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  const requestId = nanoid()
  try {
    // 1. Authenticate
    const session = await requireAuth()

    // 2. Parse and validate input
    const body = await request.json()
    const parsed = CreateBookingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid input",
            fieldErrors: parsed.error.flatten().fieldErrors }, requestId },
        { status: 422 }
      )
    }

    // 3. Authorize (if needed beyond session presence)
    // e.g., await requireRole(session, "officer")

    // 4. Execute service
    const result = await BookingService.create(session.user.id, parsed.data)

    // 5. Return response
    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    return handleApiError(error, requestId)
  }
}
```

### Rules

- Route Handlers are **thin HTTP entry points only**. No business logic here.
- Always call `requireAuth()` first on every authenticated endpoint.
- Always validate with Zod before calling any service.
- Always use `handleApiError` to produce consistent error shapes.
- All responses: `{ "data": ... }` on success; `{ "error": { "code", "message" }, "requestId" }` on failure.
- Money amounts in all JSON: integer paise. Never decimal.
- Timestamps in JSON: UTC ISO 8601.

---

## 2. Better Auth Handler (Do Not Modify)

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth/auth"
import { toNextJsHandler } from "better-auth/next-js"
export const { GET, POST } = toNextJsHandler(auth)
```

Do not add custom logic to this route. Configure auth behaviour in `lib/auth/auth.ts` only.

---

## 3. Session Validation

```typescript
import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"

// lib/auth/session.ts
export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new SkylineError("UNAUTHORIZED", "Authentication required", 401)
  return session
}

export async function requireRole(session, role: "officer" | "treasurer") {
  const r = await prisma.role.findFirst({ where: { userId: session.user.id, role } })
  if (!r) throw new SkylineError("FORBIDDEN", "Insufficient role", 403)
}

export async function requireOwner(session, resourceUserId: string) {
  if (session.user.id !== resourceUserId)
    throw new SkylineError("FORBIDDEN", "Not the resource owner", 403)
}

export async function requireActivityStaff(session, activityId: string, capability: string) {
  const staff = await prisma.activityStaff.findFirst({
    where: { activityId, userId: session.user.id, capability }
  })
  if (!staff) throw new SkylineError("FORBIDDEN", "Not assigned to this activity", 403)
}
```

**Rules:**
- Call `requireAuth()` at the very start of every authenticated Route Handler.
- Never pass `session.user.id` from a browser request directly to a DB query without first calling `requireAuth()`.
- Do not read `account.password` in application code.

---

## 4. Service Layer Rules

- Service functions receive a `userId` (actor) and validated input. Never a raw `Request`.
- Service functions must not call `requireAuth()` — that is the Route Handler's responsibility.
- Services orchestrate DB operations via `prisma.$transaction()` for multi-table writes.
- Services call provider adapters (email, payment) AFTER committing the transaction.
- Services never return `Response` objects — they return plain data or throw `SkylineError`.

---

## 5. Error Handling

```typescript
// lib/api/errors.ts
export class SkylineError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) { super(message) }
}

export function handleApiError(error: unknown, requestId: string): NextResponse {
  if (error instanceof SkylineError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message }, requestId },
      { status: error.statusCode }
    )
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "Duplicate record" }, requestId },
        { status: 409 }
      )
    }
  }
  // Unknown error — log without PII
  console.error("[API_ERROR]", { requestId, code: (error as any)?.code })
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" }, requestId },
    { status: 500 }
  )
}
```

---

## 6. Internal Job Endpoint

```typescript
// app/api/v1/internal/jobs/run/route.ts
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-job-runner-secret")
  if (secret !== process.env.JOB_RUNNER_SECRET) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })
  }
  const { job } = await request.json()
  await JobRunner.run(job)
  return NextResponse.json({ data: { ok: true } })
}
```

---

## 7. Idempotency

Financial mutations (purchase, confirm, payout) must check `IdempotencyRecord` before executing:

```typescript
const existing = await prisma.idempotencyRecord.findUnique({
  where: { actorId_operation_key: { actorId, operation, key } }
})
if (existing?.status === "success") return existing.response as T

// Execute operation
// On success: upsert IdempotencyRecord with status="success" and response
// On permanent failure: upsert with status="failed"
```

---

## 8. Pagination

Use cursor-based pagination for all list endpoints:

```typescript
const items = await prisma.claim.findMany({
  where: { claimantId: session.user.id },
  take: limit + 1,
  ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  orderBy: [{ createdAt: "desc" }, { id: "asc" }],
})
const hasMore = items.length > limit
const nextCursor = hasMore ? items[limit - 1].id : null
return { data: items.slice(0, limit), nextCursor }
```

---

## 9. CORS and Origins

Better Auth is configured with `trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL!]`. Route Handlers do not need custom CORS headers for same-origin requests. Do not add `Access-Control-Allow-Origin: *` headers on financial or auth endpoints.

---

## 10. Environment Variables

Never read `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or `SUPABASE_SERVICE_ROLE_KEY`. They do not exist in this project.

Required server-only variables:
- `DATABASE_URL` — Prisma connection string
- `BETTER_AUTH_SECRET` — minimum 32 random bytes
- `BETTER_AUTH_URL` — app URL for Better Auth origin validation
- `UPLOAD_DIR` — absolute path to receipt storage
- `JOB_RUNNER_SECRET`
- `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM_ADDRESS`
- `PAYMENT_MODE` (default: `demo`)
- `RECEIPT_TOKEN_ENCRYPTION_KEY` — 32-byte hex

Check all required variables are present at app startup; fail fast with a clear error message if any are missing.
