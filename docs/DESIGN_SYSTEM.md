# docs/DESIGN_SYSTEM.md — UX and Visual Specification

**Owner:** This file. UI behaviour, visual tokens, screen specifications and component behaviour live here.
**Last updated:** 2026-10-10 | **Status:** Proposed — no code implemented.

See [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) for data contracts. See [`docs/PRD.md`](./PRD.md) for requirements.

---

## 1. Brand Direction

**Name:** Skyline Student Association
**Personality:** Trustworthy, energetic, campus-native. Feels organized without being corporate.
**Visual direction:** Charcoal navigation, coral-red accents, readable light operational panels, subtle skyline motifs on membership/event banners, restrained animation.

---

## 2. Colour Tokens

```css
/* Brand */
--color-charcoal:     #1C1C2E;  /* Primary nav background */
--color-charcoal-mid: #2A2A40;  /* Nav hover, surface card */
--color-coral:        #E8533A;  /* Primary CTA, accent, badge active */
--color-coral-light:  #F2755E;  /* Hover state for coral */
--color-coral-muted:  #FDE8E3;  /* Light background highlights */

/* Operational panels (Club Desk) */
--color-surface:      #F8F9FA;  /* Page background */
--color-panel:        #FFFFFF;  /* Card/panel surface */
--color-border:       #E2E6EA;  /* Dividers */
--color-text-primary: #1A1A2E;  /* Body text */
--color-text-muted:   #6B7280;  /* Secondary text, labels */

/* Status */
--color-success:      #16A34A;  /* Active, confirmed, checked-in */
--color-warning:      #D97706;  /* Pending, expiring soon */
--color-error:        #DC2626;  /* Denied, failed, overdue */
--color-info:         #2563EB;  /* Info badges */

/* Finance */
--color-inflow:       #16A34A;  /* Receipts, income */
--color-outflow:      #DC2626;  /* Payouts, expenses */
--color-neutral-fin:  #6B7280;  /* Pending/excluded amounts */
```

---

## 3. Typography

**Font:** Inter (Google Fonts). Fallback: system-ui, sans-serif.

```css
/* Scale */
--text-xs:   0.75rem  / 1rem;     /* Labels, badges */
--text-sm:   0.875rem / 1.25rem;  /* Body secondary, table cells */
--text-base: 1rem     / 1.5rem;   /* Body primary */
--text-lg:   1.125rem / 1.75rem;  /* Section headings */
--text-xl:   1.25rem  / 1.75rem;  /* Page subheadings */
--text-2xl:  1.5rem   / 2rem;     /* Page headings */
--text-3xl:  1.875rem / 2.25rem;  /* Hero headings */

/* Weights */
--weight-normal:   400;
--weight-medium:   500;
--weight-semibold: 600;
--weight-bold:     700;
```

---

## 4. Spacing and Layout

- Base unit: 4px (Tailwind default)
- Content max-width: 1280px
- Panel padding: 24px (desktop), 16px (mobile)
- Card gap: 16px
- Section gap: 32px

**Grid:** 12-column at desktop (≥1024px), 4-column at tablet (768–1023px), single-column at mobile (<768px).

---

## 5. Responsive Behaviour

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | < 768px | Single column; stacked navigation; bottom-anchored CTAs |
| Tablet | 768–1023px | 2-column; collapsed sidebar |
| Desktop | ≥ 1024px | Full layout; sidebar navigation for Club Desk |

**Mobile-critical flows** (must work at 360px): signup, dues payment, ticket QR display, merchandise order, receipt upload, QR scanner.

---

## 6. Components

### Navigation
- **Top bar** (Discover Skyline / My Skyline): charcoal background, coral logo mark, white text links.
- **Sidebar** (Club Desk): charcoal background with icon + label; collapsible on tablet.
- **Mobile nav**: hamburger menu or bottom tab bar for student workspace.
- Active route: coral left border (sidebar) or coral underline (top bar).

### StatusBadge
```
active       → green bg, white text
pending      → amber bg, dark text
expired      → grey bg, muted text
confirmed    → green outline
rejected     → red bg, white text
paid         → teal bg, white text
sold_out     → red outline
```
Always include text label alongside colour. Never rely on colour alone.

### MutationButton
- Primary: coral fill, white text. Hover: coral-light.
- Secondary: border + charcoal text.
- Loading state: spinner; disabled; original label replaced with "Saving…".
- Success state: brief green check; do not show until server confirms.
- Error state: show inline error below button; re-enable for retry.

### EmptyState
- Illustration or icon (grey/muted).
- Title: what is missing.
- Subtitle: what to do.
- Optional CTA button.
- Examples: "No tickets yet — browse events to get started", "No claims submitted".

### PermissionState
- Icon: lock.
- Title: "Access restricted".
- Do not reveal the reason if it leaks data (e.g., do not say "That user's claim is private").

### MoneySummary
- Always display as "₹1,234" (formatted from paise server-side).
- Inflows in green; outflows in red/coral; pending/excluded in grey.
- Clickable totals open EvidenceDrawer.

### EvidenceDrawer
- Slide-in panel (right side, desktop; full-screen, mobile).
- Shows filtered cashbook entries or purchase records.
- Each row links to its source document.
- Receipt links are server-proxied (expiring signed URL); never direct object URL.

### TicketPass (My Skyline)
- Dark card (charcoal) with coral accent.
- Event name, date, venue.
- Large QR code (minimum 200×200px).
- Status badge: CONFIRMED / CHECKED IN.
- Skyline skyline motif watermark (subtle).
- On mobile: full-width, padding for wallet-like appearance.

### MembershipCard (My Skyline)
- Card with gradient background (charcoal → charcoal-mid).
- Member name, student ID (display only).
- Status: ACTIVE / PENDING / EXPIRED.
- Period: "2026-27 · Expires Jan 31, 2027".
- Coral accent bar at top.

### VariantSelector
- Size buttons: square chips, selectable. Available: charcoal outline. Selected: coral fill. Out of stock: grey + strikethrough.
- Never shows negative availability.
- Shows "Low stock" if availability ≤ configured threshold.

### TransactionTable
- Columns: Date, Description, Reference, Amount.
- Inflow amounts in green; outflow in red.
- Paginated; load more on scroll or button.
- Mobile: card-per-row view.

### ClaimReviewPanel (Club Desk)
- Two-column (desktop): claim details left, receipt preview right.
- Mobile: stacked; receipt in expandable section.
- Approve / Reject buttons; reject requires reason field.
- Self-approval blocked: button disabled + tooltip "You cannot review your own claim".

---

## 7. Accessibility

- All interactive elements: minimum 44×44px touch target.
- Visible keyboard focus: 2px coral outline.
- All form fields: `<label>` element linked to input.
- WCAG AA minimum contrast: body text on panel background ≥ 4.5:1, large text ≥ 3:1.
- All status badges and coloured indicators have text label.
- Images: descriptive `alt` text. Decorative images: `alt=""`.
- Announcements re-displayed as plain text; no `dangerouslySetInnerHTML`.
- Scanner results: large, high-contrast text AND auditory feedback (if API available).
- `prefers-reduced-motion`: disable animations and transitions.

---

## 8. Motion Guidelines

- **Default transition:** 150ms ease-out for colour and opacity changes.
- **Slide-in panels (drawer):** 200ms ease-out from right.
- **Page transitions:** minimal fade (100ms); not a full-page animation.
- **Loading skeletons:** pulsing grey bars (animation: 1.2s ease-in-out infinite).
- **No autoplay video or looping animation** in primary content areas.
- **Reduced-motion:** all animations off when `prefers-reduced-motion: reduce`.

---

## 9. Navigation and Route Map

```
/                           Discover Skyline home
/events                     Event listing
/events/[id]                Event detail + ticket purchase
/membership                 Membership info + join CTA
/merch                      Merchandise listing
/merch/[id]                 Product detail + order
/updates                    Public announcements
/about                      About the club

/login                      Sign in
/signup                     Create account

/me                         My Skyline dashboard
/me/membership              My membership card + renewal
/me/passes                  My tickets (QR)
/me/orders                  My merchandise orders
/me/contributions           My tasks + submitted claims
/me/updates                 My announcements (members audience)

/desk                       Club Desk today view
/desk/members               Member directory
/desk/activities            Activity list
/desk/activities/[id]       Activity Hub (tabs: Overview, Tickets, Team & Tasks, Money, Updates, Results)
/desk/tasks                 All tasks across activities
/desk/inventory             Product and variant stock management
/desk/orders                Merchandise fulfilment queue
/desk/finance               Finance summary + cashbook
/desk/claims                Reimbursement review queue
/desk/announcements         Announcement management
/desk/handover              Handover snapshot generation and history
```

---

## 10. Screen-by-Screen Specification

### 10.1 Public Homepage (/)

**Purpose:** Introduce Skyline; drive membership and event discovery.
**User:** Public visitor.
**Data:** Latest 3 upcoming events; membership status CTA; latest 2 announcements.
**Actions:** "Join Skyline" → /signup; "View events" → /events; "Learn more" → /about.
**States:**
- Default: hero with skyline illustration, coral CTA.
- Signed in (non-member): "Complete your membership" prompt.
- Signed in (active member): "Welcome back, [name]" with quick links to /me.
**Mobile:** Hero full-width; event cards stacked; CTA sticky at bottom.

---

### 10.2 Event Detail (/events/[id])

**Purpose:** Show event information; enable ticket purchase.
**User:** Public (view), authenticated (purchase).
**Data:** Title, date, venue, description, remaining seats, member price, regular price.
**Actions:** "Get Ticket" → initiates reservation (auth required). "Sign in to see member price" if unauthenticated.
**States:**
- Published, seats available: full CTA.
- Last 5 seats: "Only [N] seats left" warning badge.
- Sold out: "Sold out" badge; no purchase button.
- Not published: 404 for public; draft view for officer.
- Loading: skeleton for event details.
- Purchasing: reservation countdown ("Hold expires in 09:43"); payment step.
- Error: inline error; retry option.
**Mobile:** Event image full-width top; scrollable details; sticky purchase CTA at bottom.

---

### 10.3 My Skyline Dashboard (/me)

**Purpose:** Student's personal hub.
**User:** Authenticated student.
**Data:** Membership status, next event ticket, next order for pickup, assigned tasks, recent claims.
**Actions:** Quick links to each section. "Renew membership" if expiring soon.
**States:**
- Active member: MembershipCard component, next event.
- Pending/expired member: renewal prompt.
- Loading: skeleton cards.
- Empty: EmptyState for each section.
**Mobile:** Single column stacked cards.

---

### 10.4 My Pass (/me/passes)

**Purpose:** Access QR ticket for event entry.
**User:** Authenticated owner.
**Data:** Event name, date, venue, QR code, status.
**Actions:** Download QR (optional). Show on screen for scanning.
**States:**
- Confirmed: large QR code displayed.
- Checked in: "Checked in at [time]" badge over QR; faded appearance.
- Pending payment: "Payment pending — complete checkout" prompt; countdown if hold active.
- Empty: EmptyState "No tickets yet".
**Mobile:** Full-screen QR display mode; minimum 220×220px QR; high contrast background.

---

### 10.5 Club Desk — Activity Hub (/desk/activities/[id])

**Purpose:** Unified view of a single activity for officers.
**User:** Officer, assigned staff.
**Tabs:** Overview | Tickets & Entry | Team & Tasks | Money | Updates | Results
**Data per tab:**
- Overview: title, date, venue, published status, capacity progress bar.
- Tickets & Entry: confirmed count, check-in count, check-in interface (scan + manual), live count.
- Team & Tasks: task list, assignees, progress, overdue alerts.
- Money: income (confirmed tickets + fundraiser cash), claims (submitted/approved/paid), net result.
- Updates: linked announcements; draft new announcement.
- Results: attendance vs. ticket count; revenue vs. paid claims.
**Actions:** Publish/unpublish, edit event, add task, add staff, generate result.
**States:**
- Loading: per-tab skeleton.
- Non-ticketed fundraiser: hide Tickets & Entry tab.
- No tasks: "No tasks yet" (not "100% complete").
**Mobile:** Tab navigation becomes horizontal scrollable chips; each tab full-screen.

---

### 10.6 Finance Evidence Panel (/desk/finance)

**Purpose:** Consolidated cashbook with drill-down.
**User:** Officer, Treasurer.
**Data:** Recorded balance, approved unpaid obligations, balance after obligations, period breakdown (date range filter). Entry table.
**Actions:** Click total → open EvidenceDrawer. Filter by date, category, activity. Export (P2).
**States:**
- Loading: skeleton totals.
- Empty period: zero amounts displayed explicitly (not hidden).
- Unresolved payments: separate "Unresolved payment receipts" category, highlighted.
**Financial display rules:**
- Inflows green, outflows red/coral.
- Pending dues and pending checkouts shown separately, greyed out.
- All amounts as "₹X,XXX" (formatted from paise).
- No floating point arithmetic in display.
**Mobile:** Summary cards stacked; table becomes card list.

---

### 10.7 Handover Screen (/desk/handover)

**Purpose:** Generate and view committee handover snapshots.
**User:** Officer, Treasurer.
**Data:** Existing snapshots list, snapshot detail view.
**Actions:** "Generate new snapshot" (with notes input) → confirmed before generation. View past snapshots. Print-friendly page.
**States:**
- Generating: loading state; success shows new snapshot.
- Viewing past snapshot: prominent "Generated [date] by [name]" header; read-only.
- Empty history: EmptyState "No snapshots yet".
**Key rule:** Display clearly that this is a frozen point-in-time record. Live changes after generation are not reflected in stored snapshots.
**Mobile:** Snapshot summary readable; print layout activates on print media query.

---

### 10.8 QR Scanner (/desk/activities/[id] — Tickets tab)

**Purpose:** Fast ticket check-in at event entry.
**User:** Assigned door staff, Officer.
**Data:** Camera input or manual code entry.
**Actions:** Start camera scan; enter code manually (always available as fallback).
**States:**
- Scanning: camera viewfinder; overlay guide.
- Processing: brief "Checking..." state.
- Accepted: large green banner "CHECKED IN — [Name if available]"; beep (if supported).
- Already scanned: amber banner "ALREADY CHECKED IN at [time]"; no duplicate attendance.
- Denied (wrong event): red banner "WRONG EVENT".
- Denied (not paid): red banner "TICKET NOT CONFIRMED".
- Denied (invalid token): red banner "INVALID TICKET".
- Camera denied: full-screen fallback — text input for manual code; same validation.
**Mobile:** Full-screen scan view; large text results; quick-reset to scan next ticket.

---

## 11. Form Behaviour and Validation

- Show validation errors inline below each field (not only on submit).
- Preserve all entered values on server-side validation failure.
- Required fields marked with asterisk (*) and `aria-required`.
- Character count where relevant (claim reason: 500 chars max).
- Currency inputs: display as "₹" prefix + numeric input. Convert to paise on submit. Never store or send floats.
- File upload: show file name and size after selection. Progress bar during upload. Error if type/size invalid.
- Submit buttons: disabled during submission; restored on error.
- Confirmation dialogs for destructive or financial mutations (approve claim, record payout, generate snapshot).

---

## 12. Status Labels (Canonical)

Use these exact labels consistently across all screens and components:

| Domain | Status | Display label |
|---|---|---|
| Membership | active | Active |
| Membership | pending | Pending payment |
| Membership | cancelled | Cancelled |
| Membership | (derived) | Expired |
| Purchase | pending | Awaiting payment |
| Purchase | confirmed | Confirmed |
| Purchase | expired | Expired |
| Purchase | cancelled | Cancelled |
| Fulfilment | pending | Pending pickup |
| Fulfilment | ready | Ready for pickup |
| Fulfilment | collected | Collected |
| Task | todo | To do |
| Task | in_progress | In progress |
| Task | done | Done |
| Claim | submitted | Submitted |
| Claim | approved | Approved |
| Claim | rejected | Rejected |
| Claim | paid | Paid |
| Ticket | — | (shown as CONFIRMED or CHECKED IN) |

---

## 13. Financial Formatting

- All monetary values formatted from paise: `₹X,XXX` using `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.
- No decimal paise display (paise are internal only).
- Large values: "₹1,23,456" (Indian numbering system).
- Negative/outflow: shown as "−₹X,XXX" in red, never as "(₹X,XXX)".
- Pending/excluded amounts: "₹X,XXX (pending)" in grey.
- Never display floating-point computed totals.

---

## 14. Mobile Ticket and Scanner Behaviour

- **Ticket display**: bright white or dark card background for maximum QR contrast. Minimum QR size: 220×220px. No status-based opacity changes that reduce scan quality.
- **Full-screen mode**: optional button to expand QR to full screen; lock screen orientation to portrait.
- **Scanner**: uses camera API; permissions requested on user action, not on page load. Camera permission denial shows manual input immediately — never a broken empty state.
- **Manual input**: labelled text field "Enter ticket code"; same server validation as scan; submit on enter key.
- **Scan feedback**: result displayed for ≥ 3 seconds before auto-reset; manual dismiss also available.
