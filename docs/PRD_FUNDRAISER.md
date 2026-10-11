# docs/PRD_FUNDRAISER.md — Product Requirements Document: Fundraiser & Volunteer Task Management

**Document Owner:** Club Officer & Treasurer  
**Cross-Functional Stakeholders:** Student Frontend Developer, Management Frontend Developer, Backend Developer  
**Status:** Approved for Implementation | **Version:** 1.0.0 | **Date:** 2026-10-11  

---

## 1. Executive Summary & Problem Statement

### 1.1 Background & The Challenge

Every campus club fundraiser — a bake sale, a merchandise pop-up, a campus tech summit booth — is a coordinated team effort. Today, coordination lives entirely in group chats and mental models:

- **Task Invisibility:** Volunteers don't know what's been assigned, what's blocked, or what's left. *("Who is buying the cups? I thought you were buying the cups.")*
- **Single Point of Failure:** Only the organizer knows the full task breakdown. If they are absent, everything stalls.
- **No On-Track Visibility:** The officer cannot tell at a glance whether the fundraiser is progressing, over budget, or at risk.
- **Zero Financial Trail:** Cash collected at the door or merchandise sold informally never reaches the official cashbook.
- **Receipt Chaos:** Volunteers who spend money on supplies must chase down the treasurer for reimbursement with no formal paper trail.

### 1.2 The Solution — Core Problem Statement (PDF p.3, Req R12)

> *"Tasks split up among volunteers: who is doing what, what still needs doing, whether the fundraiser is on track."*

The **Skyline Fundraiser & Task Management Module** solves all of the above by providing:

1. **Structured Fundraiser Events:** Each fundraiser is a named activity with a declared income goal, expense budget, volunteer roster, and timeline.
2. **Volunteer Task Board:** Every task is explicitly assigned to one volunteer, has a status (`TODO → IN_PROGRESS → DONE`), a category, and an optional due date.
3. **Officer Progress Dashboard:** At a glance — how many tasks are done, who is behind, whether the fundraiser revenue target is being met.
4. **Receipt-Based Expense Claims:** Any volunteer who spends money on supplies uploads a receipt and submits a formal claim. Treasurer reviews, approves, and logs the payout — all in the platform.
5. **Cashbook Integration:** All fundraiser income (ticket sales, merchandise, direct donations) and payouts (approved claims) automatically write to the consolidated finance cashbook.

---

## 2. Target Personas & Role Matrix

| Persona | Primary Goal | Fundraiser Touchpoint | Access Permissions |
|---|---|---|---|
| **Student Guest / Prospective** (`Abhinav`) | Browse public fundraiser events | Public landing page (if fundraiser is a public event) | **Read-Only public event info** |
| **Active Volunteer / Member** (`Adithya`) | See assigned tasks, mark complete, submit expense claims | Student Workspace (`/me/tasks`, `/me/claims`) | **View own tasks · Submit claims · Upload receipts** |
| **Club Officer** (`Anvitha`) | Create fundraisers, assign tasks, monitor progress, manage volunteers | Club Desk (`/desk/fundraiser`) | **Full CRUD on Fundraisers, Tasks, Volunteers** |
| **Club Treasurer** (`Varsha`) | Review expense claims, approve payouts, reconcile cashbook | Club Desk (`/desk/claims`, `/desk/finance`) | **Approve/Reject Claims · Record Payouts · View Finance Summary** |

---

## 3. Functional Requirements

### 3.1 Fundraiser Creation & Management (Officer Desk)

- **FR-FND-01 (Fundraiser Activity):** An officer can create a new Fundraiser activity with:
  - Name / Title (e.g., "Annual Bake Sale 2026")
  - Description (Markdown-supported)
  - Date & Time (start / end)
  - Venue / Location
  - Income Goal (integer paise — converted from INR input on the form)
  - Expense Budget (integer paise)
  - Status machine: `PLANNING` → `ACTIVE` → `COMPLETED` → `CANCELLED`

- **FR-FND-02 (Volunteer Roster):** Officers can add registered members to the fundraiser's volunteer roster. Only rostered volunteers can be assigned tasks for this fundraiser.

- **FR-FND-03 (Edit & Archive):** Officers can edit fundraiser details and archive (soft-delete) a fundraiser. Archiving hides the fundraiser from the active board but preserves all tasks and claims for audit purposes.

### 3.2 Volunteer Task Board

- **FR-FND-04 (Task Creation):** Officers create tasks within a fundraiser. Each task has:

  | Field | Type | Notes |
  |---|---|---|
  | Title | String | Required, max 100 chars |
  | Description | String | Optional markdown |
  | Category | Enum | `LOGISTICS` \| `FINANCE` \| `MARKETING` \| `OPERATIONS` \| `OTHER` |
  | Assigned Volunteer | User FK | Must be on volunteer roster |
  | Due Date | DateTime? | Optional deadline |
  | Status | Enum | `TODO` \| `IN_PROGRESS` \| `DONE` \| `BLOCKED` |
  | Priority | Enum | `LOW` \| `MEDIUM` \| `HIGH` \| `URGENT` |

- **FR-FND-05 (Status Transitions):** Only the assigned volunteer or an officer can update a task's status.
  - **Volunteer:** `TODO → IN_PROGRESS → DONE`. Cannot set `BLOCKED` unilaterally — must add a blocker note first.
  - **Officer:** Any transition, including `BLOCKED` and reversal.

- **FR-FND-06 (Officer Task Board View — `/desk/fundraiser/:id/tasks`):** The officer sees a Kanban-style or list view of all tasks grouped by status:
  - Task progress summary: **X / Y tasks done**
  - Overdue tasks highlighted in amber border
  - Blocked tasks flagged in rose badge
  - Volunteer name / avatar chip on each task card

- **FR-FND-07 (Volunteer Task View — `/me/tasks`):** The member workspace shows only tasks assigned to the logged-in volunteer. The volunteer can:
  - See their full to-do list across all rostered fundraisers
  - Mark tasks `IN_PROGRESS` or `DONE`
  - Add a note or blocker comment
  - Access the **Submit Expense Claim** form pre-linked to the task

### 3.3 Expense Claims & Reimbursements

- **FR-FND-08 (Claim Submission):** A rostered volunteer can submit an `ExpenseClaim`:
  - Fundraiser (select from rostered fundraisers)
  - Description of the expense
  - Amount in INR (stored as integer paise server-side)
  - Receipt image upload — **required**; stored in `uploads/receipts/` (outside `public/`)
  - Linked task — optional FK for which task this spend supports

- **FR-FND-09 (Claim Status Machine):**
  - `PENDING` → submitted by volunteer; awaiting treasurer review
  - `APPROVED` → treasurer approves; system creates `CashbookEntry` (`direction = OUTFLOW`, `status = OBLIGATION`)
  - `PAID` → treasurer records actual payout; updates `CashbookEntry` to `status = SETTLED`
  - `REJECTED` → treasurer rejects with a **required** written reason

- **FR-FND-10 (Self-Approval Prohibition):** A treasurer who is also a rostered volunteer **cannot** approve their own submitted claim. Enforced in `Backend/lib/services/ClaimService.ts` before any database write — not as UI gating.

- **FR-FND-11 (Treasurer Claims Queue — `/desk/claims`):** The treasurer sees all pending claims with:
  - Claimant name and role
  - Fundraiser / task link
  - Amount requested (INR)
  - Inline receipt image viewer (modal on click)
  - **Approve** button and **Reject** button (reject requires a written comment)

### 3.4 Financial Tracking & Progress Metrics

- **FR-FND-12 (Income Recording):** Revenue from ticket sales or merchandise tagged to a fundraiser is automatically recorded as `CashbookEntry` rows with the `activityId` FK.

- **FR-FND-13 (Direct Cash Entry):** Officers can manually record a one-off cash collection (e.g., jar collection at the bake sale) as a `CashbookEntry` with `source = "fundraiser_cash"`.

- **FR-FND-14 (Progress Metrics — `/desk/fundraiser/:id`):** Real-time financial dashboard showing:
  - **Income Goal:** ₹X,XXX target
  - **Income Raised:** Running total of all tagged inflow `CashbookEntry` records
  - **% of Goal:** Progress bar (`incomeRaised / incomeGoal × 100`)
  - **Total Expenses:** Sum of all `PAID` + `APPROVED` outflow entries
  - **Net Surplus / Deficit:** `incomeRaised − totalExpenses`
  - **Open Claims:** Count of `PENDING` claims awaiting treasurer review

- **FR-FND-15 (Cashbook Integration):** Every fundraiser financial movement — income or approved/paid claim — writes a row to the master `CashbookEntry` table, keeping the consolidated Treasurer finance view always accurate and consistent.

---

## 4. UI/UX Specifications & Visual Design

Following the **Skyline Design System** (`docs/DESIGN_SYSTEM.md`):
- **Palette:** Pure White (`#FFFFFF`), Dark Slate (`#0A0A0A`), Accent Cobalt Blue (`#0047AB`), Off-White (`#F7F8FA`)
- **Status Color Tokens:**
  - `TODO` → Light Gray badge (`bg-gray-100 text-gray-600`)
  - `IN_PROGRESS` → Cobalt Blue badge (`bg-[#E8F0FF] text-[#0047AB]`)
  - `DONE` → Emerald Green badge (`bg-emerald-50 text-emerald-700`)
  - `BLOCKED` → Rose Red badge (`bg-rose-50 text-rose-700`)
  - `URGENT` priority → Amber border (`border-amber-400`)

### 4.1 Officer Fundraiser Desk (`/desk/fundraiser`)

**Fundraiser List Card** shows:
1. Fundraiser name + status chip (`PLANNING` amber · `ACTIVE` cobalt · `COMPLETED` emerald)
2. Date, time, and venue
3. **Task progress ring:** circular indicator showing `X / Y tasks done`
4. **Income progress bar:** `₹X,XXX raised of ₹Y,YYY goal` — fill color cobalt blue, percent label
5. **Open Claims** badge (amber if > 0)
6. Quick links: **View Tasks** | **View Claims** | **Edit**

**"New Fundraiser"** CTA button — top right, cobalt blue, opens a slide-over form panel.

### 4.2 Task Board (`/desk/fundraiser/:id/tasks`)

Two toggleable layout modes:

**Kanban Board:**
- Columns: `TODO` | `IN PROGRESS` | `DONE` | `BLOCKED`
- Each card: Task title, volunteer avatar chip, category badge, due-date countdown, priority dot
- Officer can drag cards between columns to update status

**Table / List View:**
- Sortable by: Volunteer, Due Date, Priority, Status
- Inline status dropdown per row
- Bulk actions: **Assign Volunteer**, **Mark Done**, **Delete**

### 4.3 Volunteer Task View (`/me/tasks`)

- Dedicated **My Tasks** section in the Student Workspace (`/me`)
- List of tasks assigned to the logged-in volunteer across all rostered fundraisers
- Each row: Title, Fundraiser name, Category badge, editable Status, Due date countdown
- **Submit Expense Claim** shortcut button per task (opens form pre-linked to that task)

### 4.4 Treasurer Claims Queue (`/desk/claims`)

- Tab bar: **Pending** | **Approved** | **Paid** | **Rejected**
- Each claim row: Volunteer name, Fundraiser, Task link, Amount (₹), Receipt thumbnail, Action buttons
- **Receipt Viewer Modal:** Full-size image with zoom; metadata sidebar (claimant, date, linked task)
- **Approve:** Confirmation modal → writes `CashbookEntry` obligation on confirm
- **Reject:** Required reason text field → saves `REJECTED` status + reason text

---

## 5. Technical Architecture & Database Contracts

### 5.1 Prisma Schema Mapping

All models live in [`database/prisma/schema.prisma`](file:///c:/Users/Varsha/Desktop/Skyline-Student-Association/database/prisma/schema.prisma). Key models used:

```prisma
// Each fundraiser IS an Activity with activityType = 'fundraiser'
model Activity {
  id              String    @id @default(cuid())
  name            String
  description     String?
  activityType    String    // 'fundraiser' | 'event' | 'workshop'
  status          String    @default("planning")
  startDate       DateTime?
  endDate         DateTime?
  venue           String?
  incomeGoalPaise Int?      // Target income in paise (INR × 100)
  budgetPaise     Int?      // Expense budget in paise
  createdById     String
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  createdBy       User              @relation(fields: [createdById], references: [id])
  tasks           Task[]
  claims          Claim[]
  cashbookEntries CashbookEntry[]

  @@map("activities")
}

// One unit of volunteer work within a fundraiser
model Task {
  id          String    @id @default(cuid())
  activityId  String
  title       String
  description String?
  category    String    @default("other")  // 'logistics'|'finance'|'marketing'|'operations'|'other'
  status      String    @default("todo")   // 'todo'|'in_progress'|'done'|'blocked'
  priority    String    @default("medium") // 'low'|'medium'|'high'|'urgent'
  assigneeId  String?
  dueDate     DateTime?
  blockerNote String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  activity  Activity  @relation(fields: [activityId], references: [id])
  assignee  User?     @relation(fields: [assigneeId], references: [id])
  claims    Claim[]

  @@map("tasks")
}

// A volunteer's expense reimbursement request
model Claim {
  id            String    @id @default(cuid())
  activityId    String
  taskId        String?
  claimantId    String
  reviewerId    String?
  amountPaise   Int       // Amount in paise (INR × 100)
  description   String
  receiptPath   String    // Server path: uploads/receipts/{claimId}-{uuid}.{ext}
  status        String    @default("pending") // 'pending'|'approved'|'paid'|'rejected'
  rejectionNote String?
  paidAt        DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  activity  Activity  @relation(fields: [activityId], references: [id])
  task      Task?     @relation(fields: [taskId], references: [id])
  claimant  User      @relation("ClaimsByUser",      fields: [claimantId], references: [id])
  reviewer  User?     @relation("ClaimsReviewedBy",  fields: [reviewerId],  references: [id])

  @@map("claims")
}
```

### 5.2 API Contracts

#### Fundraiser Endpoints

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/api/v1/fundraiser` | Officer | List all fundraiser activities with summary metrics |
| `GET` | `/api/v1/fundraiser/:id` | Officer / Volunteer | Fundraiser detail: tasks, metrics, claims summary |
| `POST` | `/api/v1/fundraiser` | Officer | Create a new fundraiser activity |
| `PATCH` | `/api/v1/fundraiser/:id` | Officer | Update fundraiser details or status |
| `DELETE` | `/api/v1/fundraiser/:id` | Officer | Soft-archive the fundraiser |

#### Task Endpoints

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/api/v1/fundraiser/:id/tasks` | Officer | All tasks for a fundraiser |
| `GET` | `/api/v1/tasks/mine` | Member | Tasks assigned to the authenticated volunteer |
| `POST` | `/api/v1/fundraiser/:id/tasks` | Officer | Create a new task |
| `PATCH` | `/api/v1/tasks/:id` | Officer / Assignee | Update task status, priority, note, or fields |
| `DELETE` | `/api/v1/tasks/:id` | Officer | Soft-delete a task |

#### Claims Endpoints

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/api/v1/claims` | Treasurer | List all claims (filterable by `?status=pending`) |
| `GET` | `/api/v1/claims/mine` | Member | List own submitted claims |
| `POST` | `/api/v1/claims` | Member | Submit new expense claim with `multipart/form-data` receipt upload |
| `POST` | `/api/v1/claims/:id/approve` | Treasurer | Approve claim → writes `CashbookEntry` obligation |
| `POST` | `/api/v1/claims/:id/pay` | Treasurer | Record payout → settles `CashbookEntry` |
| `POST` | `/api/v1/claims/:id/reject` | Treasurer | Reject claim with required `{ reason: string }` body |

#### Finance Metrics Endpoint

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/api/v1/fundraiser/:id/metrics` | Officer / Treasurer | Returns `{ incomeGoalPaise, incomeRaisedPaise, totalExpensesPaise, netPaise, openClaimsCount, taskProgress: { total, done, blocked } }` |

---

## 6. Business Logic & Invariants

These rules are **enforced in the service layer** (`Backend/lib/services/`) before any database write — never only as UI gating:

| # | Invariant | Service Method |
|---|---|---|
| **BI-FND-01** | `amountPaise` is always a positive non-zero integer. Never floating point. | `ClaimService.create()` |
| **BI-FND-02** | A volunteer can only submit claims for fundraisers they are explicitly rostered on. | `ClaimService.create()` |
| **BI-FND-03** | A treasurer cannot approve or pay a claim they themselves submitted (self-approval blocked). | `ClaimService.approve()` + `ClaimService.pay()` |
| **BI-FND-04** | Every approved claim creates exactly one `CashbookEntry` with `direction = OUTFLOW`. | `ClaimService.approve()` |
| **BI-FND-05** | Approving an already-`APPROVED` or `PAID` claim returns `409 Conflict` — no duplicate entries. | `ClaimService.approve()` |
| **BI-FND-06** | Task assignment is restricted to volunteers on the fundraiser roster. | `TaskService.create()` + `TaskService.update()` |
| **BI-FND-07** | `incomeGoalPaise` and `budgetPaise` are non-negative integers only. | `ActivityService.create()` |
| **BI-FND-08** | Receipt upload is mandatory for claim submission. Server validates MIME type (`image/jpeg`, `image/png`, `application/pdf`). | Route Handler multipart validation |

---

## 7. Security & Authorization Policy

| Action | Guest | Member (non-volunteer) | Rostered Volunteer | Officer | Treasurer |
|---|---|---|---|---|---|
| View public fundraiser events | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own task list | ❌ | ❌ | ✅ | ✅ | ✅ |
| Update own task status | ❌ | ❌ | ✅ (own only) | ✅ | ❌ |
| Submit expense claim | ❌ | ❌ | ✅ (rostered only) | ✅ | ✅ |
| Create fundraiser / tasks | ❌ | ❌ | ❌ | ✅ | ❌ |
| Approve / Pay / Reject claims | ❌ | ❌ | ❌ | ❌ | ✅ (not own) |
| View finance cashbook | ❌ | ❌ | ❌ | ✅ (read) | ✅ (full) |

### 7.1 Receipt File Security
- Receipts are stored in `uploads/receipts/` **outside** `public/` — they are never directly web-accessible via URL.
- Serving a receipt is gated behind authentication: `/api/v1/receipts/:filename` checks the session and verifies the requester is the claimant or a treasurer.
- Files are renamed to `{claimId}-{uuid}.{ext}` on upload to prevent directory traversal and filename collisions.

---

## 8. Acceptance Criteria & Test Scenarios

- **AC-FND-01 (Task Isolation):** A volunteer (`Adithya`) sees only their assigned tasks in `/me/tasks`. Unassigned or other-volunteer tasks never appear in their API response.

- **AC-FND-02 (Status Update Authorization):** A volunteer can mark their own task `IN_PROGRESS` and `DONE`. Updating a task assigned to another volunteer returns `403 Forbidden`.

- **AC-FND-03 (Self-Approval Blocked):** If Treasurer `Varsha` is also a rostered volunteer and submits a claim, attempting to approve it as treasurer returns `403 Forbidden` with body `{ error: "self_approval_forbidden" }`.

- **AC-FND-04 (Progress Metrics Accuracy):** After 3 tasks are marked `DONE` out of 5 total, `GET /api/v1/fundraiser/:id/metrics` returns `{ taskProgress: { total: 5, done: 3, blocked: 0 } }`. The progress ring on the officer desk shows **60%**.

- **AC-FND-05 (Cashbook Write on Approve):** When a treasurer approves a ₹500 claim, a `CashbookEntry` row with `amountPaise = 50000`, `direction = "OUTFLOW"`, `status = "OBLIGATION"` is present in the master cashbook immediately after approval.

- **AC-FND-06 (Receipt Security):** Navigating directly to `uploads/receipts/some-file.jpg` returns `404` (file is outside `public/`). The authenticated `/api/v1/receipts/:filename` endpoint serves the file only to the claimant or treasurer.

- **AC-FND-07 (Income Goal Tracking):** When a ticket sale is completed for a fundraiser-linked event, the `CashbookEntry` is tagged with `activityId` and the `/fundraiser/:id/metrics` `incomeRaisedPaise` total updates to reflect the new income.

---

## 9. Document Update Log

| Date | Version | Author | Change |
|---|---|---|---|
| 2026-10-11 | 1.0.0 | Agent (Antigravity) | Initial PRD authored and approved |
| — | — | — | — |
