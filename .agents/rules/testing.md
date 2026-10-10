# .agents/rules/testing.md — Test Obligations and Evidence Rules

**Stack:** Local PostgreSQL (skyline_test DB) + Prisma + Better Auth + Vitest (or Jest).
**Applies to:** All files in `tests/`, test utilities, and test setup.

> IMPORTANT: Tests use the skyline_test database (DATABASE_URL_TEST). Never run tests against skyline_dev. No Supabase client in any test file.

---

## 1. Test Database Setup

```bash
# Apply migrations to test DB before running integration tests
DATABASE_URL=$DATABASE_URL_TEST npx prisma migrate deploy

# Or in package.json scripts:
# "test:integration": "cross-env DATABASE_URL=$DATABASE_URL_TEST vitest run tests/integration"
```

Separate Prisma client for tests:

```typescript
// tests/helpers/prisma.ts
import { PrismaClient } from "@prisma/client"
export const testPrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_TEST } }
})
```

---

## 2. Test Categories and When to Write Them

### Unit Tests
- Pure functions: price calculation helpers, formatting utilities, Zod schema validation.
- No DB, no network.

### Integration Tests (Priority — write these first)
- Service functions: booking creation, payment confirmation, membership activation, claim workflow.
- DB state: correct records created; incorrect states rejected.
- Concurrency: concurrent seat reservation does not exceed capacity; concurrent variant reservation does not oversell.
- Authorization: unauthenticated calls rejected (401); unauthorized roles rejected (403); correct owner checks.
- Financial invariants: paise arithmetic, cashbook entries correct, self-approval/self-payout blocked.

### E2E Tests (Core journeys only)
- Membership renewal journey.
- Ticket purchase and QR check-in journey.
- Claim submission and approval journey.
- Officer creates event; student books ticket.

---

## 3. Test Data

```typescript
// tests/helpers/fixtures.ts
export async function createTestUser(tx = testPrisma) {
  // Use Better Auth API to create user (or insert directly into user + account tables for speed)
  return tx.user.create({
    data: {
      id: `test-user-${crypto.randomUUID()}`,
      email: `user-${Date.now()}@test.skyline`,
      name: "Test User",
      emailVerified: true,
    }
  })
}

export async function createTestOfficer(tx = testPrisma) {
  const user = await createTestUser(tx)
  await tx.role.create({ data: { userId: user.id, role: "officer" } })
  return user
}

export async function createTestMembership(userId: string, tx = testPrisma) {
  const period = await getOrCreateTestPeriod(tx)
  return tx.membership.create({
    data: { userId, periodId: period.id, status: "active" }
  })
}
```

- Test emails: `<prefix>-<timestamp>@test.skyline` — never real addresses.
- Clean up after each test: truncate or delete records created during the test.
- Use transactions for test isolation where possible.

---

## 4. Acceptance Criteria Evidence Rules

A feature is NOT complete until:
1. The relevant integration test passes against `skyline_test`.
2. The test verifies DB state after the operation (not just the return value).
3. Concurrent access tests pass for capacity-bounded resources (tickets, variants).
4. Authorization tests present: unauthenticated, wrong-role, wrong-owner all return correct error codes.

---

## 5. Concurrency Test Pattern

```typescript
it("concurrent bookings do not exceed capacity", async () => {
  const activity = await createTestActivity({ capacity: 1 })
  const users = await Promise.all([createTestUser(), createTestUser()])

  const results = await Promise.allSettled(
    users.map(user => BookingService.reserve(user.id, activity.id))
  )

  const successes = results.filter(r => r.status === "fulfilled")
  const failures  = results.filter(r => r.status === "rejected")
  expect(successes.length).toBe(1)
  expect(failures.length).toBe(1)

  const bookingCount = await testPrisma.booking.count({ where: { activityId: activity.id } })
  expect(bookingCount).toBe(1)
})
```

---

## 6. Financial Test Patterns

```typescript
it("confirms purchase and writes correct cashbook entry", async () => {
  const { booking, purchase } = await BookingService.reserve(userId, activityId)
  await PaymentService.confirm(purchase.id, mockPaymentEvent)

  const updated = await testPrisma.purchase.findUniqueOrThrow({ where: { id: purchase.id } })
  expect(updated.state).toBe("confirmed")

  const entry = await testPrisma.cashbookEntry.findFirst({
    where: { paymentAttemptId: expect.any(String) }
  })
  expect(entry!.direction).toBe("INFLOW")
  expect(entry!.amountPaise).toBe(purchase.amountPaise)
})

it("blocks self-approval", async () => {
  const claim = await createTestClaim({ claimantId: officerId })
  await expect(ClaimService.approve(officerId, claim.id, "approved")).rejects.toThrow("SELF_APPROVAL_FORBIDDEN")
})
```

---

## 7. What Not to Test

- Prisma internals (trust the ORM).
- Better Auth internals (trust the library).
- Next.js routing (not our code).
- Provider responses from real external services in integration tests (use stubs/mocks).

---

## 8. Test Environment Variables

```env
# .env.test
DATABASE_URL_TEST="postgresql://skyline_app:change-in-dev@127.0.0.1:5432/skyline_test"
BETTER_AUTH_SECRET=test-secret-must-be-long-enough-32chars
BETTER_AUTH_URL=http://localhost:3000
UPLOAD_DIR=/tmp/skyline_test_uploads
PAYMENT_MODE=demo
```

Never commit real secrets to `.env.test`. If `.env.test` is committed, it must contain only placeholder values.
