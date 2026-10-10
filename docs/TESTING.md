# docs/TESTING.md — Quality and Acceptance Strategy

**Owner:** This file. Testing strategy, fixtures, acceptance matrix and evidence rules live here.
**Last updated:** 2026-10-10 | **Status:** Proposed — no tests written or executed yet.

> ⚠️ Separate proposed tests from executed results. Never equate mocks with proof of database correctness. Do not claim tests pass before running them.

---

## 1. Testing Strategy

**Principle:** Business invariants and permission boundaries are tested against a real database. Mock-only tests cannot prove oversell prevention or transaction atomicity.

| Layer | Tool (proposed) | What it covers |
|---|---|---|
| Unit | Vitest | Pure utility functions, Zod schema parsing, financial formula functions |
| Integration | Vitest + Prisma client against skyline_test PostgreSQL | State machines, transactions, concurrency, permissions |
| E2E (browser) | Playwright (or similar) | One full user journey from signup to finance reconcile |
| Manual smoke | Checklist | Post-deployment verification |

**Not sufficient alone:** Mock-based tests for inventory, payments or permissions. Must be backed by integration tests against a real DB schema.

---

## 2. Integration Test Responsibilities

Integration tests must cover:
- **State transitions:** Membership pending→active, purchase pending→confirmed→expired.
- **Concurrency:** 10 simultaneous seat/variant reservations when 1 remains (exactly 1 succeeds).
- **Idempotency:** Same payment event retried returns same outcome; counters unchanged.
- **Permissions:** Every endpoint tested with wrong role and wrong owner.
- **Financial formulas:** Exact paise arithmetic verified against fixture.

Each integration test runs against a disposable, seeded PostgreSQL database. Tests must be deterministic and not depend on shared state.

---

## 3. Test Fixtures

### Seed data for integration tests

```
Profiles:
  - student1@test (active member, current period)
  - student2@test (non-member)
  - officer1@test (role: officer)
  - treasurer1@test (role: treasurer)
  - door1@test (activity_staff: checkin for gala)

Membership period:
  - label: "2026-27", starts_at: 2026-01-01, ends_at: 2027-01-01
  - dues_paise: 20000 (INR 200 — illustrative, not PS price)

Activity (event):
  - title: "Spring Gala", ticketed: true, capacity: 10
  - member_price_paise: 20000, regular_price_paise: 40000

Products:
  - "Skyline Hoodie", variants: [S:5, M:1, L:3]

Opening balance: 500000 paise (INR 5,000)
```

### Financial reconciliation fixture (from ARCHITECTURE.md §12)

| Operation | Recorded balance | Approved unpaid |
|---|---:|---:|
| Opening balance | 500,000 paise | 0 |
| Confirm dues (student1) | 520,000 paise | 0 |
| Confirm gala ticket | 540,000 paise | 0 |
| Confirm hoodie Medium | 620,000 paise | 0 |
| Approve supply claim INR 150 | 620,000 paise | 15,000 paise |
| Record payout INR 150 | 605,000 paise | 0 |

Retrying any confirmation/payout must leave the final balance unchanged.

---

## 4. Requirements-to-Tests Traceability

| Test ID | Description | Requirement IDs | Type |
|---|---|---|---|
| AT01 | Signup + dues confirmation | R01–R03 | Integration |
| AT02 | Expired/pending member pricing | R02/R16 | Integration |
| AT03 | Renewal for next period | R03–R04 | Integration |
| AT04 | Last-seat concurrency | R05–R06 | Integration (concurrent) |
| AT05 | Same payment event retried | R14/R16 | Integration |
| AT06 | Different duplicate paid attempt | R16 | Integration |
| AT07 | Late confirmation after expiry | R06/R11/R16 | Integration |
| AT08 | Duplicate QR scan | R07 | Integration |
| AT09 | Wrong event/unpaid/invalid token | R07 | Integration |
| AT10 | Last size variant concurrency | R10–R11 | Integration (concurrent) |
| AT11 | Repeated expiry job | R06/R11 | Integration |
| AT12 | Price changed after purchase | R02/R10 | Integration |
| AT13 | Claim submitted→approved→paid | R13–R15 | Integration |
| AT14 | Self-review or duplicate payout | R13/R16 | Integration |
| AT15 | Other student receipt access | R16 | Integration |
| AT16 | Role/paid-status manipulation | R16 | Integration |
| AT17 | Publish retry and email failure | R09 | Integration |
| AT18 | Volunteer updates another task | R12/R16 | Integration |
| AT19 | Camera denied / mobile viewport | R07/R17 | E2E / Manual |
| AT20 | Financial fixture and filters | R08/R14–R15 | Integration |
| AT21 | Handover after subsequent sale | R20 | Integration |
| AT22 | Reload after each action | R01/R05/R10/R13 | E2E |

---

## 5. Permission Tests

Every Route Handler must be tested for:

| Test | Expected |
|---|---|
| Unauthenticated request to protected endpoint | 401 |
| Student accessing officer endpoint | 403 |
| Officer accessing treasurer-only endpoint | 403 |
| Treasurer reviewing their own claim | 403 |
| User accessing another user's purchase/receipt | 403 |
| User accessing another user's ticket QR | 403 |
| Volunteer updating unassigned task | 403 |
| Door staff checking in wrong activity | 403 |
| Browser-supplied price for purchase | Server-computed price used; client value ignored |
| Browser-supplied role claim | Ignored; server reads from DB |

---

## 6. Transaction and Concurrency Tests

### AT04 — Last seat: 10 concurrent buyers

```typescript
// Proposed test (not yet executed)
describe('reserve_ticket concurrency', () => {
  it('allows exactly one booking when 1 seat remains', async () => {
    // Seed: activity with capacity=1, 0 existing bookings
    const attempts = await Promise.all(
      Array.from({ length: 10 }, () => reserveTicket(activityId, userIds[i]))
    )
    const successes = attempts.filter(r => r.success)
    expect(successes).toHaveLength(1)
    // All others must be SOLD_OUT (409)
  })
})
```

**Status:** PROPOSED — not written or executed.

### AT10 — Last Medium hoodie: concurrent buyers

```typescript
// Proposed test (not yet executed)
describe('reserve_order concurrency', () => {
  it('allows exactly one order when 1 Medium remains', async () => {
    // Seed: variant M with stock_total=1, stock_reserved=0, stock_sold=0
    const attempts = await Promise.all(
      Array.from({ length: 5 }, () => reserveOrder(variantId, 1, userIds[i]))
    )
    const successes = attempts.filter(r => r.success)
    expect(successes).toHaveLength(1)
    const variant = await getVariant(variantId)
    expect(variant.stock_reserved).toBe(1)
    expect(variant.stock_total - variant.stock_reserved - variant.stock_sold).toBe(0)
  })
})
```

**Status:** PROPOSED — not written or executed.

---

## 7. Core End-to-End Journey

**Proposed scenario (not yet executed):**

1. Navigate to `/` as public visitor.
2. Click "Join Skyline" → fill signup form → create account.
3. Navigate to `/membership` → click "Pay dues" → complete demo payment.
4. Verify: `/me/membership` shows ACTIVE status.
5. Navigate to `/events/[gala-id]` → click "Get Ticket" → see member price applied.
6. Complete demo payment → ticket issued.
7. Navigate to `/me/passes` → see QR code.
8. As door staff: navigate to `/desk/activities/[gala-id]` → Tickets tab.
9. Scan QR → see CHECKED IN.
10. Scan again → see ALREADY CHECKED IN (same time, no duplicate attendance).
11. Navigate to `/merch/[hoodie-id]` → select Medium → order → pay.
12. As officer: mark order Ready → student sees Collected.
13. As student: upload receipt → submit claim for INR 150.
14. As treasurer: approve claim → record payout.
15. Navigate to `/desk/finance` → verify balance matches fixture.
16. Navigate to `/desk/handover` → generate snapshot.
17. Create another ticket sale → verify old snapshot unchanged.
18. Browser refresh → all state retained.

**Status:** PROPOSED — not written or executed.

---

## 8. Mobile and Accessibility Checks

| Check | Expected | Status |
|---|---|---|
| Signup flow at 360px | No overflow; form submittable | Proposed |
| Ticket QR at 360px | Full QR visible without scroll | Proposed |
| Scanner at 360px | Camera viewfinder full-width; manual input reachable | Proposed |
| Keyboard navigation | All interactive elements reachable with Tab | Proposed |
| Screen reader | Form labels read correctly; status badges include text | Proposed |
| Color contrast | AA minimum 4.5:1 for body text | Proposed |

---

## 9. Financial Reconciliation Verification

Expected results for fixture (see §3 above):

```
GET /api/v1/finance/summary?from=2026-01-01&to=2026-12-31

Expected response:
{
  "data": {
    "recordedBalance": 605000,      // paise
    "approvedUnpaid": 0,            // paise (after payout)
    "balanceAfterObligations": 605000,
    "inflows": 120000,              // dues(20000) + ticket(20000) + hoodie(80000)
    "outflows": 15000,              // claim payout
    "periodBreakdown": [...]
  }
}
```

**Verification steps:**
1. Run fixture operations in order.
2. After each step, call finance summary and verify balance matches fixture table.
3. Retry each confirmation/payout step and verify balance unchanged.
4. Verify no floating-point values in any response.

**Status:** PROPOSED — not executed.

---

## 10. Deployment Smoke Checks

Run after each deployment:

| Check | Method | Expected |
|---|---|---|
| Home page loads | GET / | 200, HTML |
| API health | GET /api/v1/membership-periods | 200, JSON |
| Auth works | POST signup + login | Session cookie set |
| DB connected | GET /me (authenticated) | 200 with profile |
| Demo payment flow | Full purchase via demo | Confirmed in DB |
| Receipt upload | Upload JPEG via claim intent | Object created in private bucket |
| Check-in | Scan valid ticket | ACCEPTED response |
| Finance summary | GET /api/v1/finance/summary | 200 with correct paise totals |
| Demo-confirm disabled in prod | POST /payments/demo-confirm (prod) | 404 or 403 |
| HTTPS | Browser request | Redirect to https:// |
| RLS active | Direct DB query with anon key for other user data | Empty result or 403 |

---

## 11. Release Criteria

Before submission:
- [ ] AT04, AT08, AT10, AT13, AT14, AT15, AT20 passed as integration tests with real DB
- [ ] E2E journey executed and passes on deployed environment
- [ ] No known money duplication, oversell or unauthorized receipt access
- [ ] Finance totals reconcile to fixture
- [ ] Browser refresh retains all confirmed state
- [ ] Mobile 360px tested manually or in browser devtools
- [ ] All demo/test payment endpoints visibly labelled
- [ ] Deployment smoke checks completed and passed
- [ ] Any unmet criterion documented — not labelled as complete

**Evidence required:** Test run command, output, date, environment. Screenshots or logs for concurrency tests.
