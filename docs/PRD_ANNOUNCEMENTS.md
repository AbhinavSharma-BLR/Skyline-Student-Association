# docs/PRD_ANNOUNCEMENTS.md — Product Requirements Document: Official Announcements & Dispatches

**Document Owner:** Club Officer & Operations Lead  
**Cross-Functional Stakeholders:** Student Frontend Developer, Management Frontend Developer, Backend Developer  
**Status:** Approved for Implementation | **Version:** 1.0.0 | **Date:** 2026-10-11  

---

## 1. Executive Summary & Problem Statement

### 1.1 Background & The Challenge
In typical campus organizations, critical club communications—such as emergency venue changes, general body meeting calls, election deadlines, and dues reminders—are broadcast across dozens of unorganized WhatsApp group chats. 

This creates severe operational breakdowns:
- **Information Fragmentation:** Important messages get buried under casual conversation.
- **Audience Confusion:** Non-members receive internal governance messages, or prospective students miss out on open invitation events.
- **Zero Accountability & Historical Loss:** There is no permanent, auditable log of *"who said what and when"*. If a dispute arises over meeting rules or project deadlines, the record is lost in chat histories.
- **Deliverability Gaps:** Students mute large chat groups and miss time-critical notices.

### 1.2 The Solution
The **Skyline Official Announcements Module** provides an authoritative, centralized communication engine:
1. **Single Authoritative Source of Truth:** Club Officers create, schedule, and publish official dispatches from the Club Desk (`/desk`).
2. **Dual-Audience Scoping:**
   - **Public Landing Page (Guest View):** Displays open campus announcements (recruitment drives, public tech summits, open workshops, club achievements).
   - **Member Landing Page & Member Workspace (`/me`):** Displays confidential governance updates (internal meeting agendas, constitution amendment ballots, volunteer briefings, member-exclusive merchandise drops).
3. **Auditable Permanent Record:** Every dispatch is permanently logged with author identity, timestamp, revision history, and category tag.
4. **Multi-Channel Dispatch:** Publishing an announcement delivers the message in-app and automatically enqueues asynchronous email delivery to registered members via the system background job runner.

---

## 2. Target Personas & Role Matrix

| Persona | Primary Goal | Announcements Touchpoint | Access Permissions |
|---|---|---|---|
| **Student Guest / Prospective Member** (`Abhinav`) | Discover club activities, attend open events, decide whether to pay dues. | Public Landing Page (`/` Section: *Campus Dispatches*) | **Read-Only (Public Dispatches Only)** |
| **Active Student Member** (`Adithya`) | Stay informed on internal deadlines, general meetings, priority tickets, and voting. | Landing Page (Member View) & Student Workspace (`/me/updates`) | **Read-Only (Public + Member-Only Dispatches)** |
| **Club Officer** (`Anvitha`) | Broadcast official notices, set agendas, coordinate logistics, issue meeting alerts. | Club Desk (`/desk/announcements`) | **Full CRUD: Draft, Edit, Publish, Pin, Archive** |
| **Club Treasurer** (`Varsha`) | Publish financial audit summaries, dues deadlines, and funding notices. | Club Desk (`/desk/announcements`) | **Create & Publish Financial Dispatches** |

---

## 3. Functional Requirements

### 3.1 Authoring & Dispatch Management (Club Officer / Desk)
- **FR-ANN-01 (Creation):** Club Officers can draft announcements with a Title, Body (Markdown-supported), Category Tag, Priority Level, and Target Audience.
- **FR-ANN-02 (Audience Scoping):** Every announcement must be strictly categorized into one of two target audiences:
  - `public` (*All Visitors & Guests*): Rendered on the public website for any student or visitor.
  - `members` (*Active Paid Members Only*): Restricted to students with verified, active annual memberships.
- **FR-ANN-03 (Categorization):** Officers can tag dispatches with standardized categories:
  - `Meeting` (General Body Meetings, Committee syncs, Agenda briefings)
  - `Urgent / Alert` (Time-sensitive changes, venue relocations, cancellation alerts)
  - `Event & Tickets` (Event dates, ticket sales launch, speaker reveals)
  - `Finance & Dues` (Audit reports, dues deadlines, reimbursement submission windows)
  - `Governance` (Elections, constitutional amendments, committee appointments)
- **FR-ANN-04 (Pinning / Highlight):** Officers can mark up to 2 announcements as **Pinned / Broadcast Banner**, keeping them sticky at the top of the feed.
- **FR-ANN-05 (Publishing State Machine):**
  - `DRAFT`: Saved privately in Club Desk; visible only to Officers and Treasurers.
  - `PUBLISHED`: Made live immediately or at scheduled `publishedAt` timestamp.
  - `ARCHIVED`: Hidden from active feeds but preserved in the historical archive.
- **FR-ANN-06 (Mailing List Integration):** When an announcement with `audience = "members"` or `audience = "public"` is published, the backend enqueues idempotent `email_jobs` for delivery to eligible user profiles.

### 3.2 Guest Landing Page Presentation (`/` Public Feed)
- **FR-ANN-07 (Public Feed):** Unauthenticated visitors and student guests (`Abhinav`) visiting the homepage see the **"Campus Dispatches & Announcements"** section.
- **FR-ANN-08 (Security Boundary):** The public endpoint `/api/v1/announcements` filters records strictly where `publishedAt IS NOT NULL` AND `audience = "public"`. Members-only records are never sent in the HTTP payload.
- **FR-ANN-09 (Call-to-Action for Guests):** If a guest browses the public announcement board, a subtle informational badge is shown: *"Members receive internal agendas, meeting minutes, and voting alerts. Join Skyline to unlock member dispatches."*

### 3.3 Member Landing Page & Member Workspace (`/me`)
- **FR-ANN-10 (Authenticated Member Feed):** Logged-in active members (`Adithya`) see all public dispatches **plus** members-only dispatches, clearly badged with a distinct `[MEMBER EXCLUSIVE]` indigo pill.
- **FR-ANN-11 (Workspace Tab `/me`):** Within the Member Workspace, an **Updates & Dispatches** tab displays:
  - Unread dispatch count indicator.
  - Full-length announcement view with markdown rendering, downloadable attachments, and date/time metadata.
  - Dedicated filter: *All Updates*, *Upcoming Meetings*, *Finance Audits*, *Urgent Alerts*.
- **FR-ANN-12 (Meeting Dispatches):** Announcements tagged as `Meeting` display structured meeting metadata:
  - Date & Time
  - Venue / Room / Virtual Link
  - Formal Agenda Items (numbered checklist)
  - Presiding Officer name

---

## 4. UI/UX Specifications & Visual Design

Following the **Skyline Design System** (`docs/DESIGN_SYSTEM.md`), the announcements interface strictly adheres to:
- **Color Palette:** Pure White (`#FFFFFF`), Off-White (`#F7F8FA`), Dark Slate (`#0A0A0A`), Border Gray (`#E5E7EB`), Accent Cobalt Blue (`#0047AB`).
- **Urgent Alerts:** Ruby Red / Amber accent border with soft tinted badge (`bg-rose-50 text-rose-700 border-rose-200`).
- **Member Dispatches:** Cobalt Blue pill with security lock icon (`bg-[#E8F0FF] text-[#0047AB]`).

### 4.1 Card Components Breakdown
Each announcement card features:
1. **Header Row:** Category Badge (`Meeting` | `Finance` | `Urgent`), Target Audience Pill (`Public` | `Member Exclusive`), and Formatted Date (`Oct 11, 2026 · 10:30 AM`).
2. **Title:** High-contrast `font-extrabold text-[#0A0A0A]`.
3. **Summary Body:** Clean readable typography with line clamps on cards, expandable on click.
4. **Author Signature:** Author name and office (`Posted by Officer Anvitha · Operations Desk`).
5. **Meeting Attachment Box (if applicable):** Structured container showing venue, calendar reminder button, and agenda highlights.

---

## 5. Technical Architecture & Database Contracts

### 5.1 Prisma Schema Mapping
Reuses and builds upon the existing database models in [`database/prisma/schema.prisma`](file:///c:/Users/Varsha/Desktop/Skyline-Student-Association/database/prisma/schema.prisma):

```prisma
model Announcement {
  id          String    @id @default(cuid())
  title       String
  body        String
  activityId  String?
  audience    String    @default("public") // 'public' | 'members'
  authorId    String
  category    String    @default("general") // 'meeting' | 'urgent' | 'event' | 'finance' | 'governance'
  isPinned    Boolean   @default(false)
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  author    User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  activity  Activity?  @relation(fields: [activityId], references: [id])
  emailJobs EmailJob[]

  @@map("announcements")
}
```

### 5.2 API Contracts

| Method | Endpoint | Access Role | Description |
|---|---|---|---|
| `GET` | `/api/v1/announcements` | Public / Member | Lists announcements. Server checks user session: if guest/unauthenticated, returns `audience = "public"` only. If member, returns `public` + `members`. |
| `GET` | `/api/v1/announcements/:id` | Public / Member | Fetches single announcement with 403 enforcement if guest attempts to view members-only record. |
| `POST` | `/api/v1/announcements` | Officer / Owner | Creates a new draft or published announcement. |
| `PATCH` | `/api/v1/announcements/:id` | Officer / Owner | Updates announcement content, category, or pinned status. |
| `POST` | `/api/v1/announcements/:id/publish` | Officer / Owner | Transitions `publishedAt = now()` and enqueues `email_jobs` for delivery. |
| `DELETE` | `/api/v1/announcements/:id` | Officer / Owner | Soft-archives the announcement record. |

---

## 6. Acceptance Criteria & Test Scenarios

- **AC-ANN-01 (Guest Isolation):** A guest viewing the home page sees only announcements with `audience: "public"`. Intercepting the network request verifies that zero members-only records or agendas leak in the JSON response.
- **AC-ANN-02 (Member Entitlement):** When logging in as an active member (`Adithya`), the feed seamlessly updates to display both public and members-only announcements, including meeting agendas.
- **AC-ANN-03 (Officer Authoring):** An officer (`Anvitha`) can publish an announcement from `/desk/announcements`. The announcement appears immediately on the target feeds without requiring server restarts.
- **AC-ANN-04 (Meeting Record Durability):** Meeting announcements retain their exact published date, author, venue, and checklist items indefinitely to fulfill constitutional archive compliance.

---

## 7. Security & Authorization Policy

Following `.agents/rules/security.md`, every announcement endpoint enforces strict server-side role checks — **no UI-only gating**.

| Action | Guest (unauthenticated) | Active Member | Officer / Treasurer |
|---|---|---|---|
| Read public dispatches | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| Read member-only dispatches | ❌ 403 Forbidden | ✅ Allowed (membership verified server-side) | ✅ Allowed |
| Create / Draft announcement | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Allowed |
| Publish announcement | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Allowed (`requireRole(session, "officer")`) |
| Pin / Unpin announcement | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Allowed |
| Archive announcement | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Allowed |

### 7.1 Server-Side Membership Verification
Before returning `audience = "members"` records, the API Route Handler must validate:
1. `session.user` exists and is authenticated (Better Auth session check).
2. The user has an active `Membership` record with `status = "active"` and `expiresAt > now()`.
3. If either condition fails → `403 Forbidden` with body `{ error: "members_only_dispatch" }`.

### 7.2 Data Exposure Rules
- **Never** include `authorId` raw in public API responses. Always resolve to `{ authorName, authorRole }` shape.
- **Never** expose `DRAFT` records to any non-officer session, even if the ID is known.
- **Never** filter audience on the client — filtering must happen entirely in the Prisma `where` clause on the server.

---

## 8. Email Dispatch Integration

When an officer publishes an announcement (`POST /api/v1/announcements/:id/publish`), the backend service performs:

```typescript
// AnnouncementService.ts — publish() method (pseudocode)
async publish(announcementId: string, officerId: string) {
  const ann = await this.setPublishedAt(announcementId, officerId);

  // Enqueue idempotent email jobs for eligible recipients
  const recipients = await this.resolveRecipients(ann.audience);
  await this.emailJobQueue.enqueueMany(
    recipients.map((user) => ({
      type: "announcement_dispatch",
      announcementId: ann.id,
      recipientId: user.id,
      recipientEmail: user.email,
    }))
  );

  return ann;
}
```

### 8.1 Email Template Spec
Each dispatched email contains:
- **Subject:** `[Skyline] {Category}: {Title}` (e.g., `[Skyline] URGENT: Venue Change for Tech Summit`)
- **Preview Text:** First 120 characters of the announcement body.
- **Body:** Full announcement body rendered from Markdown to plain HTML.
- **Footer:** `Posted by {Author Name}, {Author Role} · Skyline Student Association · {Date}`
- **Unsubscribe Link:** Per-user unsubscribe token (one-click, no account required).

### 8.2 Idempotency Guarantee
- Each `email_job` record is keyed on `(announcementId, recipientId)` with a `UNIQUE` constraint.
- Re-publishing (e.g. after a minor edit) must check existing jobs and skip already-enqueued recipients.
- Background mailer marks jobs as `SENT` or `FAILED` with timestamp; failed jobs are retried up to 3 times.

---

## 9. Officer Desk UI Specification (`/desk/announcements`)

### 9.1 Announcements List View
The Desk homepage for this module shows a paginated table of all announcements (draft, published, archived) with:
- Status chip: `DRAFT` (amber), `PUBLISHED` (green), `ARCHIVED` (gray)
- Audience badge: `PUBLIC` (light gray) | `MEMBER ONLY` (cobalt blue)
- Quick actions: **Edit**, **Pin/Unpin**, **Archive**
- **Create Announcement** CTA button (top-right, cobalt blue, `font-semibold`)

### 9.2 Create / Edit Form

| Field | Input Type | Validation |
|---|---|---|
| Title | Text input | Required, max 120 chars |
| Body | Markdown textarea | Required, min 20 chars |
| Category | Select dropdown | One of: `Meeting` \| `Urgent` \| `Event & Tickets` \| `Finance & Dues` \| `Governance` |
| Target Audience | Radio group | `public` or `members` |
| Pin this announcement | Toggle switch | Max 2 active pins enforced server-side |
| Schedule publish at | Date-time picker | Optional; if blank, publishes immediately on submit |

### 9.3 Meeting Announcement Extra Fields
When `Category = "Meeting"` is selected, three additional fields expand inline:
1. **Meeting Date & Time** — `datetime-local` input
2. **Venue / Room / Virtual Link** — Text input
3. **Agenda Items** — Dynamic add-row list (each item: text input + drag handle for reordering)

### 9.4 Publish Flow
1. Officer fills form → **Save Draft** (persists without publishing).
2. Officer reviews preview → **Publish Now** or selects scheduled date → **Schedule**.
3. On confirmation modal: *"This will be sent via email to N members. Confirm?"*
4. On confirm → `POST /api/v1/announcements/:id/publish` → success toast + feed refresh.

---

## 10. Document Update Log

| Date | Version | Author | Change |
|---|---|---|---|
| 2026-10-11 | 1.0.0 | Agent (Antigravity) | Initial PRD authored and approved |
| — | — | — | — |

