# docs/INTEGRATION_CONTRACT.md — Shared API Contract

**Owner:** Backend Developer. Contract changes must be posted in docs/progress/backend.md before dependent roles adopt them.
**Last updated:** 2026-10-10
**Status:** Specification only — no endpoints implemented yet.

> This is the single source of truth for cross-lane communication.
> Frontend developers must match these shapes exactly. No ad-hoc field names.
> Backend must not change these shapes without announcing in the progress log first.

---

## 1. Global Conventions

### Base Path
```
/api/v1/
```
Better Auth routes: `/api/auth/*` (managed by Better Auth; do not call directly in frontend — use `auth.client.ts`)

### Response Envelope

**Success:**
```json
{ "data": <payload> }
```

**Success (list):**
```json
{
  "data": [ <item>, ... ],
  "nextCursor": "<cuid or null>",
  "hasMore": true
}
```

**Error:**
```json
{
  "error": {
    "code": "<ERROR_CODE>",
    "message": "<human-readable string>",
    "fieldErrors": { "<field>": ["<message>"] }
  },
  "requestId": "<nanoid>"
}
```

### HTTP Status Codes

| Status | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 204 | No content (delete/void) |
| 400 | Bad request / business rule violation |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 422 | Validation error (fieldErrors present) |
| 429 | Rate limited |
| 500 | Unexpected server error |

### Error Codes

| Code | Meaning |
|---|---|
| `UNAUTHORIZED` | No valid session |
| `FORBIDDEN` | Session valid; insufficient role/ownership |
| `NOT_FOUND` | Resource does not exist |
| `VALIDATION_ERROR` | Zod parse failed; fieldErrors present |
| `CONFLICT` | Duplicate record (unique constraint) |
| `CAPACITY_EXHAUSTED` | No seats remaining |
| `STOCK_EXHAUSTED` | Variant out of stock |
| `MEMBERSHIP_REQUIRED` | Member-only resource |
| `MEMBERSHIP_ALREADY_ACTIVE` | Cannot renew active membership |
| `PAYMENT_ALREADY_PROCESSED` | Idempotency key conflict |
| `SELF_APPROVAL_FORBIDDEN` | Claimant cannot approve own claim |
| `SELF_PAYOUT_FORBIDDEN` | Cannot pay own or self-reviewed claim |
| `TICKET_ALREADY_USED` | QR check-in already recorded |
| `TICKET_NOT_VALID` | Wrong activity or unpaid ticket |
| `DEMO_MODE_ONLY` | Demo-confirm endpoint called outside demo mode |
| `INTERNAL_ERROR` | Unexpected server error |

### Pagination (cursor-based)

```
GET /api/v1/claims?limit=20&cursor=<cuid>
```
Response: `{ data: [...], nextCursor: "<cuid>" | null, hasMore: boolean }`
Default limit: 20. Max limit: 100.

### Date/Time Format
- All timestamps: **UTC ISO 8601** — `"2026-10-10T08:15:00.000Z"`
- Display in `Asia/Kolkata` at the UI layer only

### Money Format
- All amounts: **integer paise** (BigInt in Prisma; serialized as JSON number)
- Example: INR 150.00 = `15000`
- Never decimal. Never floating point in API responses.
- Display: `(paise / 100).toFixed(2)` — presentation layer only

### Idempotency
- Header: `Idempotency-Key: <uuid>` on POST financial mutations
- Backend checks `IdempotencyRecord` before executing
- Duplicate key with different body: returns 409

### Auth Headers
- Session cookie managed by Better Auth automatically
- No manual `Authorization: Bearer` header needed for browser clients

---

## 2. Current User / Session

```
GET /api/auth/get-session   (Better Auth — use auth.client.ts, not raw fetch)
```

**Session object (returned by `auth.api.getSession()` server-side or `authClient.getSession()` client-side):**
```ts
{
  user: {
    id: string           // cuid
    email: string
    name: string
    emailVerified: boolean
    image?: string | null
    createdAt: Date
    updatedAt: Date
  }
  session: {
    id: string
    userId: string
    token: string
    expiresAt: Date
    createdAt: Date
    updatedAt: Date
  }
}
```

**Profile (included in member-facing responses via join):**
```ts
{
  userId: string
  studentId?: string | null   // college student ID
  phone?: string | null
  bio?: string | null
  avatarUrl?: string | null
}
```

---

## 3. Membership

```
GET    /api/v1/memberships/me          — current user's active membership
POST   /api/v1/memberships             — initiate membership/renewal
POST   /api/v1/memberships/:id/confirm — confirm after payment (called by payment webhook)
GET    /api/v1/membership-periods      — list available periods (public)
```

**MembershipResponse:**
```ts
{
  id: string
  userId: string
  periodId: string
  period: {
    id: string
    name: string          // e.g. "2026-27"
    startDate: string     // ISO 8601
    endDate: string       // ISO 8601
    duesPaise: number     // integer paise
  }
  status: "pending" | "active" | "expired" | "cancelled"
  activatedAt: string | null
  expiresAt: string | null
  isMember: boolean       // computed: status === "active" && now < expiresAt
  createdAt: string
}
```

**MembershipStatus enum** (import from `lib/schemas/membership.ts`):
`"pending" | "active" | "expired" | "cancelled"`

---

## 4. Activity (Event)

```
GET    /api/v1/activities              — list published activities (public)
GET    /api/v1/activities/:id          — activity detail (public)
POST   /api/v1/activities              — create activity [officer]
PATCH  /api/v1/activities/:id          — update activity [officer]
```

**ActivityResponse:**
```ts
{
  id: string
  title: string
  description: string
  location: string
  startsAt: string          // ISO 8601
  endsAt: string | null
  status: "draft" | "published" | "completed" | "cancelled"
  capacity: number | null   // null = unlimited
  seatsRemaining: number | null
  memberPricePaise: number
  publicPricePaise: number
  coverImageUrl: string | null
  createdAt: string
}
```

**ActivityStatus enum:** `"draft" | "published" | "completed" | "cancelled"`

---

## 5. Booking and Ticket

```
POST   /api/v1/bookings               — reserve seat + create purchase intent
POST   /api/v1/bookings/:id/confirm   — confirm booking after payment [webhook]
GET    /api/v1/bookings/me            — current user's bookings
GET    /api/v1/tickets/me             — current user's tickets (with QR)
POST   /api/v1/tickets/:id/checkin    — scan check-in [activity staff]
GET    /api/v1/activities/:id/attendance — attendance list [officer]
```

**BookingResponse:**
```ts
{
  id: string
  activityId: string
  userId: string
  status: "pending_payment" | "confirmed" | "cancelled" | "expired"
  amountPaise: number
  purchaseId: string | null
  ticket: TicketResponse | null
  createdAt: string
  expiresAt: string | null
}
```

**TicketResponse:**
```ts
{
  id: string
  bookingId: string
  activityId: string
  activity: { id: string; title: string; startsAt: string; location: string }
  encryptedToken: string    // for QR code generation — opaque to frontend
  checkedInAt: string | null
  isUsed: boolean
  createdAt: string
}
```

**CheckinResponse:**
```ts
{
  result: "ACCEPTED" | "DENIED"
  reason: string | null     // "ALREADY_USED" | "NOT_VALID" | "WRONG_ACTIVITY" | null
  ticket: { id: string; userId: string; checkedInAt: string | null }
}
```

**BookingStatus enum:** `"pending_payment" | "confirmed" | "cancelled" | "expired"`

---

## 6. Product and Variant (Merchandise)

```
GET    /api/v1/products                — list published products (public)
GET    /api/v1/products/:id            — product detail with variants (public)
POST   /api/v1/products               — create product [officer]
PATCH  /api/v1/products/:id           — update product [officer]
PATCH  /api/v1/variants/:id           — update variant stock [officer]
```

**ProductResponse:**
```ts
{
  id: string
  name: string
  description: string
  imageUrl: string | null
  status: "draft" | "published" | "archived"
  variants: VariantResponse[]
  createdAt: string
}
```

**VariantResponse:**
```ts
{
  id: string
  productId: string
  label: string                // e.g. "S", "M", "L", "XL"
  memberPricePaise: number
  publicPricePaise: number
  stockTotal: number
  stockReserved: number
  stockSold: number
  stockAvailable: number       // computed: stockTotal - stockReserved - stockSold
}
```

---

## 7. Order

```
POST   /api/v1/orders                  — create order + reserve stock
POST   /api/v1/orders/:id/confirm      — confirm order after payment [webhook]
GET    /api/v1/orders/me               — current user's orders
GET    /api/v1/orders                  — all orders [officer]
PATCH  /api/v1/orders/:id/fulfil       — mark collected [officer]
```

**OrderResponse:**
```ts
{
  id: string
  userId: string
  status: "pending_payment" | "confirmed" | "fulfilled" | "cancelled" | "expired"
  totalPaise: number
  items: OrderItemResponse[]
  createdAt: string
  expiresAt: string | null
  fulfilledAt: string | null
}
```

**OrderItemResponse:**
```ts
{
  id: string
  variantId: string
  variant: { id: string; label: string; product: { id: string; name: string } }
  quantity: number
  unitPricePaise: number
  linePaise: number           // unitPricePaise * quantity
}
```

**OrderStatus enum:** `"pending_payment" | "confirmed" | "fulfilled" | "cancelled" | "expired"`

---

## 8. Task

```
GET    /api/v1/tasks                   — list tasks [officer — all; staff — own activity]
POST   /api/v1/tasks                   — create task [officer]
PATCH  /api/v1/tasks/:id               — update task / change status
PATCH  /api/v1/tasks/:id/assign        — assign user [officer]
```

**TaskResponse:**
```ts
{
  id: string
  activityId: string | null
  title: string
  description: string | null
  status: "open" | "in_progress" | "done" | "cancelled"
  assigneeId: string | null
  assignee: { id: string; name: string } | null
  dueDate: string | null
  createdAt: string
}
```

**TaskStatus enum:** `"open" | "in_progress" | "done" | "cancelled"`

---

## 9. Claim (Reimbursement)

```
POST   /api/v1/claims                  — submit claim [authenticated]
GET    /api/v1/claims/me               — own claims
GET    /api/v1/claims                  — all claims [treasurer]
PATCH  /api/v1/claims/:id/approve      — approve claim [treasurer, not self]
PATCH  /api/v1/claims/:id/reject       — reject claim [treasurer, not self]
PATCH  /api/v1/claims/:id/payout       — record payout [treasurer, not reviewer, not claimant]
GET    /api/v1/claims/:id/receipt      — stream receipt file [owner or treasurer]
POST   /api/v1/claims/:id/receipt      — upload receipt file [owner, before approval]
```

**ClaimResponse:**
```ts
{
  id: string
  claimantId: string
  claimant: { id: string; name: string }
  activityId: string | null
  title: string
  description: string
  amountPaise: number
  status: "submitted" | "under_review" | "approved" | "rejected" | "paid"
  reviewerId: string | null
  reviewer: { id: string; name: string } | null
  reviewNote: string | null
  payoutRef: string | null
  hasReceipt: boolean           // true if file uploaded; never expose storagePath
  reviewedAt: string | null
  paidAt: string | null
  createdAt: string
}
```

**ClaimStatus enum:** `"submitted" | "under_review" | "approved" | "rejected" | "paid"`

> Receipt download: `GET /api/v1/claims/:id/receipt` — server streams file with `Content-Disposition: attachment`. Never expose `storagePath` in JSON response.

---

## 10. Finance Summary and Cashbook Entry

```
GET    /api/v1/finance/summary         — totals [officer or treasurer]
GET    /api/v1/finance/entries         — cashbook entries (paginated) [officer or treasurer]
POST   /api/v1/finance/fundraiser      — record fundraiser receipt [treasurer]
```

**FinanceSummaryResponse:**
```ts
{
  totalInflowPaise: number
  totalOutflowPaise: number
  netBalancePaise: number
  pendingObligationsPaise: number     // approved but unpaid claims
  trueAvailablePaise: number          // netBalance - pendingObligations
  membershipRevenuePaise: number
  ticketRevenuePaise: number
  merchandiseRevenuePaise: number
  fundraiserRevenuePaise: number
  totalExpenditurePaise: number
  asOf: string                        // ISO 8601 timestamp of calculation
}
```

**CashbookEntryResponse:**
```ts
{
  id: string
  direction: "INFLOW" | "OUTFLOW"
  amountPaise: number
  category: "MEMBERSHIP" | "TICKET" | "MERCHANDISE" | "FUNDRAISER" | "CLAIM_PAYOUT" | "OTHER"
  description: string
  activityId: string | null
  referenceType: "purchase" | "claim" | "fundraiser_receipt"
  referenceId: string
  recordedAt: string
  recordedById: string
}
```

---

## 11. Announcement

```
GET    /api/v1/announcements           — published announcements (public)
GET    /api/v1/announcements/:id       — single announcement (public)
POST   /api/v1/announcements           — create draft [officer]
PATCH  /api/v1/announcements/:id/publish — publish [officer]
```

**AnnouncementResponse:**
```ts
{
  id: string
  title: string
  body: string                // markdown or plain text
  authorId: string
  author: { id: string; name: string }
  status: "draft" | "published"
  publishedAt: string | null
  targetAudience: "all" | "members_only"
  createdAt: string
}
```

---

## 12. Handover Snapshot

```
POST   /api/v1/snapshots               — generate snapshot [officer]
GET    /api/v1/snapshots               — list snapshots [officer]
GET    /api/v1/snapshots/:id           — get snapshot [officer]
```

**SnapshotResponse:**
```ts
{
  id: string
  generatedById: string
  generatedBy: { id: string; name: string }
  schemaVersion: string           // e.g. "1"
  periodLabel: string
  generatedAt: string
  snapshotJson: {                 // frozen at generation time
    totalInflowPaise: number
    totalOutflowPaise: number
    netBalancePaise: number
    memberCount: number
    eventCount: number
    completedTaskCount: number
    openClaimCount: number
    generatedAt: string
    // additional summary fields
  }
}
```

> Snapshot content is immutable after creation. `snapshotJson` never changes after insert.

---

## 13. Upload / Download Flow

### Receipt Upload
```
POST /api/v1/claims/:id/receipt
Content-Type: multipart/form-data
Body: file field (JPEG, PNG, PDF; max 5 MB)
```
- Server validates extension, magic bytes, MIME type, size
- Stores at `UPLOAD_DIR/<uuid>.<ext>` (outside public/)
- Returns `{ data: { receiptUploaded: true } }`
- Never returns storage path

### Receipt Download
```
GET /api/v1/claims/:id/receipt
Authorization: session cookie
```
- Server checks: authenticated + (owner or treasurer)
- Streams file with `Content-Disposition: attachment; filename="receipt.<ext>"`
- Never redirects to a direct file URL

---

## 14. Payment / Demo Mode

### Demo Payment Confirm (dev/demo only)
```
POST /api/v1/payments/demo-confirm
Body: { purchaseId: string }
Requires: PAYMENT_MODE=demo in env
```
- Disabled (returns 404) when `PAYMENT_MODE !== "demo"`
- UI must display a visible "SIMULATED PAYMENT" badge when using this endpoint

### Payment Webhook (real provider)
```
POST /api/v1/webhooks/payment
Headers: provider-specific signature header
```
- Verifies signature before processing
- Idempotent: processes once per `paymentAttemptId`

---

## 15. Role and Capability Names

Role names used in `requireRole()` and DB `role` table:

| Role | DB value | Description |
|---|---|---|
| Officer | `"officer"` | Can manage events, tasks, inventory, announcements |
| Treasurer | `"treasurer"` | Can review claims, record payouts, view full cashbook |
| Activity staff (check-in) | activity_staff record | Can scan tickets for specific activity |
| Activity staff (volunteer) | activity_staff record | Can view tasks for specific activity |

---

## 16. Mock Data Convention

- Mocks live in `tests/fixtures/` or `__mocks__/`
- Enabled only when `process.env.USE_MOCK_DATA === "true"`
- Must exactly match the response shapes in this contract
- Never silently fall back to mocks if a real API call fails
- All mock data removed or clearly flagged before demo submission

---

## 17. Contract Change Protocol

1. Backend developer drafts the change in `docs/progress/backend.md`
2. Posts in team channel: "CONTRACT CHANGE: [endpoint] — [what changed]"
3. Waits for both frontend developers to acknowledge
4. Implements the change
5. Updates this file
6. Frontend developers update their usage

> Changes to established shapes during integration (Phase 3+) require all four teammates' agreement.
