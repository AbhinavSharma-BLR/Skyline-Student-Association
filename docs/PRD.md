# docs/PRD.md — Product Requirements Document

**Owner:** This file. All product requirements and acceptance criteria live here.
**Last updated:** 2026-10-10 | **Status:** Proposed — no code implemented.

See [`brain.md`](../brain.md) for current phase. See [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) for technical contracts.

---

## 1. Problem Statement

**Source: Student_Organization_System.pdf, p.1 — "The Challenge"**

The Skyline Student Association runs events, sells memberships and merchandise, and manages a small budget. Today:

- Member sign-ups are tracked in a spreadsheet.
- Event tickets are sold at the door for cash.
- Club budget is tracked in a notebook.
- Announcements are sent one by one on WhatsApp.
- Volunteer expenses are reimbursed after chasing receipts.

Result: members lose track of events, money goes missing, and nobody knows who still owes what.

**The task (PDF p.1):** Build one unified software platform — the digital backbone of a busy campus club — that solves each of these problems.

---

## 2. Target Users

| User | Description |
|---|---|
| **Student (non-member)** | Prospective or casual participant; can buy regular-price tickets and merch |
| **Student (active member)** | Paid current-period member; receives member pricing on tickets and merch |
| **Volunteer** | Assigned to tasks for a specific activity |
| **Door staff** | Checks tickets at event entry; scoped to one activity |
| **Officer** | Manages events, tasks, inventory, announcements; not necessarily the treasurer |
| **Treasurer** | Reviews and approves expense claims; records payouts; access to finance summary |
| **Owner officer** | At least one; can assign/revoke officer and treasurer roles |

> An account is not the same as a paid membership. Every signed-in user has an account; only those who have paid dues for the current period have an active membership.

---

## 3. Explicit PDF Requirements (with page references)

### PDF p.2 — Membership

- **R01** A new student signs up; the club knows who they are, whether they have paid dues, and what the membership gets them.
- **R02** Members receive discounts on tickets and merchandise ("member benefits").
- **R03** Memberships run out at the end of the year; a member should be reminded to renew before it lapses.
- **R04** At an event, it should be easy to check that someone is, in fact, a member.

### PDF p.2 — Events / Ticketing

- **R05** Tickets for events go on sale online, with different prices for members and non-members.
- **R06** There is a limit on how many seats are left (capacity enforcement).
- **R07** On the night, someone at the door should be able to check a ticket in seconds, without a printed list.
- **R08** After the event: how many people actually showed up, and how much the event made.

### PDF p.3 — Announcements

- **R09** Post one announcement that reaches every member; keep a record of what was said and when. A simple website and mailing list.

### PDF p.3 — Merchandise

- **R10** Sell branded merchandise online; members order from their phones, collect sizes, take orders and payments.
- **R11** Know how many of each size are actually left in stock (size-level inventory).

### PDF p.3 — Volunteer Tasks / Fundraiser

- **R12** Tasks split up among volunteers: who is doing what, what still needs doing, whether the fundraiser is on track.

### PDF p.4 — Finance / Treasurer

- **R13** Reimburse volunteers for expenses; receipt-based reimbursement review.
- **R14** One place showing dues collected, tickets sold, merchandise sold, every reimbursement; what came in, what went out, how much is left.

---

## 4. Derived Engineering Requirements

| ID | Derived from | Requirement |
|---|---|---|
| R15 | R01/R14 | Pending dues, pending orders and approved unpaid claims are tracked separately from collected cash. |
| R16 | R05/R07/R13 | All price-determining logic, role checks and inventory operations run server-side only. Paid history is immutable. |
| R17 | R07/R10 | Core student flows (join, buy, scan, receipt) are usable at 360px viewport width. |

---

## 5. Proposed Differentiators

### P1: Activity Hub
One activity page connects tickets, tasks, volunteers, money and updates. Each tab queries the same `activity_id`; no data is siloed or duplicated.

### P1: Financial Evidence Panel
Selecting a dashboard total opens filtered records. Selecting a record opens its source purchase or claim with amount, confirmation method, reference and time. Receipt visibility remains permission-controlled.

### P1: Committee Time Capsule (Handover Snapshot)
A dated, frozen snapshot containing recorded balance, approved unpaid claims, pending dues, stock by size, upcoming activities, open tasks and committee notes. Stored so printing it later does not silently change its content.

---

## 6. Prioritised Scope

### P0 — Required (must work at demo)

| Feature | Key requirement IDs |
|---|---|
| Student signup and account creation | R01 |
| Membership dues payment and activation | R01, R02, R03 |
| Annual expiry and renewal | R03, R04 |
| Renewal reminder job | R03, R04 |
| Public event listing and detail | R05 |
| Online ticket purchase (member/non-member prices) | R05, R02 |
| Seat capacity enforcement | R06 |
| QR digital ticket and check-in | R07 |
| Event attendance and revenue result | R08 |
| Public announcements and mailing list | R09 |
| Member mailing audience | R09 |
| Merchandise listing with size variants | R10, R11 |
| Online merchandise order and payment | R10 |
| Size-level stock enforcement | R11 |
| Volunteer task assignment and tracking | R12 |
| Fundraiser activity type | R12 |
| Receipt upload and reimbursement claim | R13 |
| Claim review (approve/reject) and payout record | R13 |
| Consolidated finance cashbook | R14 |
| Pending dues vs. collected separation | R15 |
| Server-side authorization and price enforcement | R16 |
| Mobile-responsive web | R17 |

### P1 — Differentiators (after P0 gate)

- Activity Hub (R18)
- Financial evidence drill-down (R19)
- Committee handover snapshot (R20)
- Club health alerts (R21)

### Deferred / P2

- Voting/elections
- Multiple membership tiers / free honorary memberships
- Merchandise delivery / non-campus pickup
- Multi-club tenancy
- Bank integration / automated reconciliation
- Real-money refund workflows
- Offline scanning with conflict resolution
- Rich text announcements
- Notification preferences / unsubscribe management
- Membership identity verification (campus email / registrar)

---

## 7. Feature Matrix

| Feature | Student | Officer | Treasurer | Public |
|---|---|---|---|---|
| View events and merch | ✓ | ✓ | ✓ | ✓ |
| Signup / login | ✓ | ✓ | ✓ | — |
| Pay dues / renew membership | ✓ | ✓ | ✓ | — |
| Buy tickets (member price if eligible) | ✓ | ✓ | ✓ | — |
| Buy merchandise | ✓ | ✓ | ✓ | — |
| View own tickets, orders, claims | ✓ | ✓ | ✓ | — |
| Submit reimbursement claim | ✓ | ✓ | ✓ | — |
| Check-in tickets (assigned) | — | ✓ | ✓ (if assigned) | — |
| Manage events, tasks, inventory | — | ✓ | — | — |
| Publish announcements | — | ✓ | — | — |
| View member directory | — | ✓ | Dues fields only | — |
| Review / pay claims | — | — | ✓ (not own) | — |
| Record fundraiser cash receipt | — | — | ✓ | — |
| View finance summary and cashbook | — | ✓ | ✓ | — |
| Generate handover snapshot | — | ✓ | ✓ | — |
| Assign officer/treasurer roles | — | Owner only | — | — |

---

## 8. Role-Specific User Journeys

### 8.1 New Student Joining (PDF p.2)

1. Visits `/membership` — sees current dues amount and benefits.
2. Clicks "Join Skyline" → creates account (email + password).
3. Redirected to checkout — sees dues amount, pricing basis "Standard membership".
4. Pays (demo adapter) → membership activates atomically.
5. Receives confirmation; redirected to `/me/membership` showing active pass.
6. On subsequent logins, membership status is always visible on `/me`.

**Business rules:**
- One membership per user per period.
- Account exists independently of paid membership.
- Pending dues do not count as active membership.

### 8.2 Student Buying a Ticket (PDF p.2)

1. Visits `/events/[id]` — sees event detail, remaining seats, member/regular price.
2. Clicks "Get Ticket" → server checks membership and resolves price.
3. Server reserves seat for 10 minutes; returns server-computed price and `reservedUntil`.
4. Student completes payment within hold window.
5. Server confirms payment → issues QR ticket (opaque token, no personal data).
6. Ticket visible at `/me/passes`. QR downloadable.

**Business rules:**
- Price eligibility determined at purchase time. Ticket remains valid if membership later expires.
- Capacity enforced with row-level lock. Concurrent buyers competing for last seat: exactly one succeeds.
- Seat reservation expires if payment not completed within 10 minutes.

### 8.3 Door Staff Checking In (PDF p.2)

1. Opens `/desk/activities/[id]` check-in screen on phone.
2. Scans QR with camera or enters code manually.
3. Server checks: correct event, confirmed paid ticket, not yet checked in — all atomically.
4. Large green (accepted) or red (denied with reason) result displayed within 2 seconds (p95).
5. Duplicate scan returns original check-in time without adding attendance.

### 8.4 Student Ordering Merchandise (PDF p.3)

1. Visits `/merch` → browses products with available sizes.
2. Selects product, size and quantity → server checks member status for member price.
3. Server reserves stock for 10 minutes.
4. Student pays → order confirmed, stock consumed.
5. Order visible at `/me/orders` with fulfilment status.
6. Officer marks order as "ready" and then "collected" at campus pickup.

### 8.5 Volunteer Submitting a Claim (PDF p.4)

1. Uploads receipt image/PDF via `/me/contributions`.
2. Enters amount (INR), reason, optional activity link.
3. Submits claim → status = `submitted`.
4. Treasurer reviews in Club Desk: approves (claim is now an obligation) or rejects (reason required).
5. After physical payment, treasurer records payout with external reference → status = `paid`.
6. Cashbook records actual outflow; balance reduced.

**Business rules:**
- Treasurer cannot approve or pay their own claim.
- Approval alone does not create a cashbook entry. Only recorded payout does.
- Rejected claim may be resubmitted as a new linked claim.

### 8.6 Treasurer Closing the Books (PDF p.4)

1. Opens `/desk/finance` — sees recorded balance, approved unpaid obligations, period breakdown.
2. Drills into any total to see source records.
3. Views `/desk/claims` for outstanding approvals.
4. Generates handover snapshot at `/desk/handover` — frozen dated summary.

---

## 9. Functional Requirements (Stable IDs)

| ID | Requirement |
|---|---|
| FR01 | A user can create an account with email and password. |
| FR02 | An account can hold a membership for one active period at a time. |
| FR03 | A membership has a start date, end date and dues amount fixed at period configuration time. |
| FR04 | A member's eligibility (for pricing) is checked on the server at the moment of purchase. |
| FR05 | A membership auto-expires at the configured period end; no permanent membership. |
| FR06 | The system sends renewal reminders N days before period end (N configurable). |
| FR07 | A student can view and pay dues for the next configured period while current period is active. |
| FR08 | An officer can publish events with member price, regular price, capacity and date. |
| FR09 | A student can purchase one ticket per booking. |
| FR10 | Seats are reserved atomically with a 10-minute hold on checkout initiation. |
| FR11 | A confirmed payment issues exactly one QR ticket with an opaque token. |
| FR12 | A ticket QR can be scanned or the code entered manually for check-in. |
| FR13 | Check-in is atomic: verified once, then immutable. Duplicate scans return prior result. |
| FR14 | Post-event: attendance count (checked-in) and revenue (confirmed paid tickets) are shown separately. |
| FR15 | An officer can create products with size variants and initial stock levels. |
| FR16 | Stock per variant is decremented atomically on purchase confirmation. |
| FR17 | Fulfilment states: `pending` → `ready` → `collected`; officer controls progression. |
| FR18 | An officer can create tasks for an activity with assignee, due date and status. |
| FR19 | An assignee can update their task status; cannot reassign themselves to other tasks. |
| FR20 | A student can upload a private receipt and submit a reimbursement claim. |
| FR21 | A treasurer can approve or reject a claim with a required reason for rejection. |
| FR22 | A treasurer can record a payout with an external reference; this creates a cashbook outflow. |
| FR23 | Self-approval and self-payout are blocked server-side. |
| FR24 | An officer can publish an announcement with public or members-only audience. |
| FR25 | Publishing an announcement enqueues email delivery jobs for eligible recipients. |
| FR26 | The finance cashbook shows confirmed receipts minus recorded payouts = recorded balance. |
| FR27 | Pending dues, pending checkouts and approved unpaid claims are shown separately from cash. |
| FR28 | An officer or treasurer can generate a frozen handover snapshot. |

---

## 10. Business Rules and State Transitions

### Membership states: `pending` → `active` | `cancelled`
- `expired` is derived (period end < now), not a stored state.
- Eligibility = active record + confirmed payment + period currently active.

### Purchase states: `pending` → `confirmed` | `expired` | `cancelled`
- Payment attempt states: `pending` → `confirmed` | `failed`
- Reservation hold: 10 minutes. Expired purchase releases reservation.

### Merchandise fulfilment states: `pending` → `ready` → `collected`
- Payment confirmation and physical fulfilment are tracked separately.

### Task states: `todo` → `in_progress` → `done`
- Overdue = deadline < now AND not `done`.

### Claim states: `submitted` → `approved` | `rejected` → (`paid` from `approved`)
- `rejected` claims may produce a new linked resubmission.
- `approved` = obligation. `paid` = actual cashbook outflow.

---

## 11. Acceptance Criteria

| AT ID | Test | Expected result |
|---|---|---|
| AT01 | Signup + dues confirmation | `pending` → `active`; one cashbook receipt |
| AT02 | Expired/pending member buys ticket | Regular price applied; client-manipulated amount rejected |
| AT03 | Renewal for next period while active | Next period saved; current eligibility unchanged |
| AT04 | Last-seat concurrency (10 simultaneous buyers) | Exactly one success; others receive 409 SOLD_OUT |
| AT05 | Same payment event retried | One fulfilment, one receipt |
| AT06 | Second distinct successful payment for same purchase | No second fulfilment; `reconciliation_required` flag set |
| AT07 | Late confirmation after reservation expiry | No oversell; receipt and exception preserved |
| AT08 | Duplicate QR scan | Exactly one check-in; duplicate returns original time |
| AT09 | Wrong event / unpaid / invalid token | Entry denied with reason |
| AT10 | Last Medium hoodie concurrency | Exactly one success; no negative stock |
| AT11 | Expiry job runs twice on same reservation | Hold released once; counters not double-decremented |
| AT12 | Price changed after purchase confirmed | Historical purchase amount unchanged |
| AT13 | Claim submitted → approved → payout recorded | Approval changes obligation total; payout changes cash |
| AT14 | Self-review or duplicate payout attempt | Forbidden (403) or original idempotent response |
| AT15 | Other student tries to access someone's receipt | Denied (403) including direct storage object request |
| AT16 | Role/membership manipulation via browser | Server rejects; authoritative values from database |
| AT17 | Announcement published; email provider fails | Job persisted in failed/retry state; announcement remains |
| AT18 | Volunteer updates another person's task | Denied unless officer |
| AT19 | Camera denied on mobile | Manual scan code entry works; layout usable at 360px |
| AT20 | Finance fixture sums | Match expected paise totals; pending money excluded |
| AT21 | Handover snapshot after subsequent sale | Old snapshot unchanged; new snapshot reflects sale |
| AT22 | Browser refresh after each key action | Confirmed state retained across reload |

---

## 12. Non-Functional Targets

| Area | Target |
|---|---|
| Scale fixture | 500 profiles, 10 activities, 100 tickets/event, 20 product variants |
| Scan response | p95 ≤ 2 seconds across 50 scans on demo deployment |
| Concurrency | 10 concurrent attempts for last seat/variant: exactly 1 succeeds |
| Money correctness | Exact paise arithmetic; no floating-point drift |
| Core durability | Refresh/re-login on another browser preserves confirmed purchases |
| Mobile | Student flows usable at 360px; officer desktop tables may scroll |
| Access | Every private endpoint has positive + negative role/ownership tests |

These are validation targets, not benchmark claims. Disclose if measurements fail.

---

## 13. Key Clarifications

| Concept | Clarification |
|---|---|
| Account vs. membership | An account is any signed-in user. A membership is a paid entitlement for a specific annual period. |
| Annual membership validity | One period per year, configured by officer (not hard-coded December). Eligibility = period active AND payment confirmed. |
| Price eligibility at purchase time | Server checks membership at the moment of checkout initiation. A later expiry does not retroactively invalidate the purchase. |
| Tickets sold vs. attendance | "Tickets sold" = fulfilled confirmed purchases. "Attendance" = unique check-ins. |
| Product vs. size variant | A product (hoodie) has one or more size variants (S, M, L). Stock is tracked per variant. |
| Payment vs. fulfilment | Payment confirmation and physical collection (campus pickup) are tracked in separate fields. |
| Claim approval vs. payout | Approval creates an obligation. Payout creates a cashbook outflow. They are separate events. |
| Recorded balance vs. bank balance | Recorded balance = opening balance + confirmed receipts - recorded payouts. This is not a bank-verified figure. |
| Pending dues vs. abandoned checkout | Pending dues (membership not yet confirmed) are potential receivables. Abandoned carts are not continuing debts. |

---

## 14. Assumptions and Open Questions

| # | Assumption / Question |
|---|---|
| A1 | Custom stack is permitted by competition rules. Verify before coding. |
| A2 | One annual membership plan per period; amount set by officer. |
| A3 | INR only; all amounts in integer paise. |
| A4 | Campus pickup only for merchandise; no delivery. |
| A5 | Demo payment adapter is acceptable for hackathon demo. |
| A6 | Student identity is not verified beyond self-entered student ID. |
| OQ1 | What is the membership dues amount for this year? |
| OQ2 | What is the configured period end date? |
| OQ3 | How many days before expiry should reminder emails be sent? |

---

## 15. Success Measures

1. A student can join, receive correct member pricing, purchase a ticket and retrieve the QR ticket after browser refresh.
2. Door staff can scan and check in within 2 seconds p95.
3. Concurrency tests confirm no oversell of last seat or last size.
4. Finance totals reconcile to expected paise across the fixture defined in `docs/TESTING.md`.
5. A new committee member can understand unfinished work and financial obligations from the handover snapshot without speaking to the outgoing team.
