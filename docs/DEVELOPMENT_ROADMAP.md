# docs/DEVELOPMENT_ROADMAP.md — Skyline Development Tracker

**Project:** Skyline Student Association ERP  
**Last Updated:** 2026-10-10  
**Current Status:** Phase A — Foundation & Project Stability  
**Active Working Directory:** `frontend/` (Next.js 16 + React 19 + Tailwind CSS v4)

---

## 1. Project Audit Summary (Current Baseline)

| Component | Status | Reality on Disk |
|---|---|---|
| **Root Repository** | Planning & Docs | Contains PRD, Architecture, Security, Design System, and agent rules. |
| **Frontend Location** | Initialized | Exists in `frontend/` with Next.js 16 App Router, TypeScript, and Tailwind CSS. |
| **Homepage (`/`)** | Working Prototype | Complete hero, navigation, events preview, community CTA, and responsive footer in `frontend/src/app/page.tsx`. |
| **Sign-up (`/signup`)** | Working Prototype | Interactive registration form with validation feedback, password toggle, and state handling in `frontend/src/app/signup/page.tsx`. |
| **Login (`/login`)** | **BROKEN (Regression)** | `frontend/src/app/login/page.tsx` was accidentally overwritten with duplicate Home landing page code. Missing login form. |
| **Backend & APIs** | Not Started | No `app/api/` route handlers or services yet implemented. |
| **Database & ORM** | Not Started | Prisma schema, PostgreSQL setup, and migrations not yet created in application code. |
| **Authentication** | Not Started | Better Auth not yet installed or integrated; forms currently simulate UI feedback. |

---

## 2. Requirements Checklist

### Must-Have for Hackathon MVP (P0)
- [ ] **A1 — Restore Login Interface:** Proper student/officer login form with email, password toggle, remember-me, validation feedback, and links to `/signup`.
- [ ] **A2 — Brand & UI Consistency:** Align color palette (Charcoal `#1C1C2E`, Coral `#E8533A`, Slate `#F8F9FA`), typography, and mobile hamburger navigation per `docs/DESIGN_SYSTEM.md`.
- [ ] **B1 — Reusable Component Primitives:** Clean UI primitives (Button, Input, Badge, Card, Modal, StatusNotice) in `frontend/src/components/ui/`.
- [ ] **C1 — Auth & Role State Management:** Client-side auth provider/context with demo roles (`student_member`, `student_non_member`, `officer`, `treasurer`) to allow immediate demonstrable testing of all portals before backend is wired.
- [ ] **D1 — Member Workspace (`/me`):** Student Activity Hub showing membership status (Active/Dues pending), purchased tickets, merchandise orders, and reimbursement requests.
- [ ] **D2 — Membership Plans & Dues Checkout:** Membership payment flow with simulated/demo payment adapter and immediate pass issuance.
- [ ] **D3 — Events & QR Pass UI:** Event listing, detail page with member vs non-member pricing, seat hold reservation countdown, and QR code pass generator.
- [ ] **E1 — Club Desk Portal (`/desk`):** Officer dashboard with restricted tab layout, event attendance summary, and inventory stock overview.
- [ ] **E2 — Door Staff QR Check-in (`/desk/checkin`):** Camera scanner or fast code lookup to validate and check in student event tickets in seconds.
- [ ] **E3 — Finance Cashbook & Evidence Drill-Down (`/desk/finance`):** Cashbook showing dues collected, ticket sales, merch sales, approved claims, and recorded payouts with drill-down to source receipts.
- [ ] **E4 — Reimbursement Submission & Review (`/desk/claims`):** Student receipt upload form and treasurer review queue (Approve/Reject/Record Payout).

### Important Features to Implement Next (P1)
- [ ] **F1 — Committee Handover Time Capsule (`/desk/handover`):** Printable, frozen, dated snapshot of club finances, open tasks, remaining merch stock, and committee notes.
- [ ] **F2 — Volunteer Task Management:** Task assignment, progress tracking, and volunteer duty board for campus activities.
- [ ] **F3 — Announcements & Member Bulletins:** Feed of club announcements with category tags and date tracking.

### Advanced / Post-MVP (P2)
- [ ] Real PostgreSQL + Prisma integration (once local DB service is configured).
- [ ] Live Better Auth session cookies with server-side Route Handlers.
- [ ] Real-money payment gateway integration (Razorpay/Stripe test mode).
- [ ] Real-time WebSocket or polling ticket capacity counters.

---

## 3. Phase-Wise Implementation Roadmap

### Phase A — Foundation & Project Stability
- **Objective:** Fix current UI regressions, ensure all baseline routes (`/`, `/login`, `/signup`) compile cleanly, and eliminate broken links.
- **Tasks:**
  - `A.1`: Restore `frontend/src/app/login/page.tsx` with high-quality sign-in form, state feedback, and links.
  - `A.2`: Verify navigation header and footer across all public pages.
  - `A.3`: Ensure mobile responsiveness (<768px) with mobile navigation drawer or toggle.
- **Status:** **IN PROGRESS**

### Phase B — UI Consistency & Reusable Design System
- **Objective:** Integrate the visual design language defined in `docs/DESIGN_SYSTEM.md`.
- **Tasks:**
  - `B.1`: Setup theme tokens in CSS (Charcoal `#1C1C2E`, Coral `#E8533A`, Surface `#F8F9FA`).
  - `B.2`: Create reusable component library: `Button`, `Input`, `Card`, `Badge`, `Modal`.
- **Status:** Not Started

### Phase C — Interactive Auth & Persona Switcher (Demo-Ready)
- **Objective:** Enable one-click testing of all user roles without backend friction.
- **Tasks:**
  - `C.1`: Build an interactive demo persona switcher (Student Member, Student Guest, Officer, Treasurer).
  - `C.2`: Wire simulated session state for immediate multi-role demonstration.
- **Status:** Not Started

### Phase D — Student Portal ("My Skyline" — `/me`)
- **Objective:** Deliver the student member experience.
- **Tasks:**
  - `D.1`: Member dashboard (`/me`) with membership card, digital passes, and quick actions.
  - `D.2`: Membership dues payment checkout flow (`/membership/join`).
  - `D.3`: Event ticket booking with member pricing discount and QR pass generation.
  - `D.4`: Student reimbursement claim form with receipt upload UI.
- **Status:** Not Started

### Phase E — Management Portal ("Club Desk" — `/desk`)
- **Objective:** Deliver the officer and treasurer operational workspace.
- **Tasks:**
  - `E.1`: Club Desk dashboard shell with role-guarded tab navigation.
  - `E.2`: Member directory and dues status tracking.
  - `E.3`: Event capacity manager and door QR scanner check-in tool.
  - `E.4`: Treasurer cashbook with income/expense logs and reimbursement claim approval workflow.
- **Status:** Not Started

### Phase F — Advanced Hackathon Differentiators
- **Objective:** Implement the standout features from `docs/PRD.md`.
- **Tasks:**
  - `F.1`: Activity Hub (connecting tickets, tasks, budget, and updates on one event page).
  - `F.2`: Committee Handover Time Capsule (printable, frozen financial & operational snapshot).
- **Status:** Not Started

### Phase G — Quality Assurance & Testing
- **Objective:** Zero broken links, zero console errors, responsive at 360px viewport width, passed production build.
- **Tasks:**
  - `G.1`: Comprehensive route testing (`/`, `/login`, `/signup`, `/me/*`, `/desk/*`).
  - `G.2`: Full `npm run build` validation.
- **Status:** Not Started

---

## 4. Task Execution Log

| Task ID | Description | Affected Files | Status | Completion Date |
|---|---|---|---|---|
| **P0-AUDIT** | Full repository audit & roadmap creation | `docs/DEVELOPMENT_ROADMAP.md` | Completed | 2026-10-10 |
| **A.1** | Restore login page & fix duplicate landing page | `frontend/src/app/login/page.tsx` | Completed | 2026-10-10 |
| **A.2** | Mobile responsive navigation drawer | `frontend/src/app/page.tsx` | Completed | 2026-10-10 |
| **B.1** | Reusable UI component library (Button, Card, Badge, Input) | `frontend/src/components/ui/*` | Completed | 2026-10-10 |
| **C.1** | Interactive Auth Context & floating Persona Switcher | `frontend/src/context/auth-context.tsx`, `PersonaSwitcher.tsx` | Completed | 2026-10-10 |
| **D.1** | Student Member Workspace (`/me`) with pass card & claims | `frontend/src/app/me/page.tsx` | Completed | 2026-10-10 |
| **D.2** | Real receipt uploads (PDF/JPG/PNG) & receipt preview modal | `frontend/src/app/me/page.tsx` | Completed | 2026-10-10 |
| **E.1** | Management Workspace (`/desk`) with check-in & cashbook | `frontend/src/app/desk/page.tsx` | Completed | 2026-10-10 |
| **E.2** | Camera QR scanner, QR image upload & SVG pass generator | `frontend/src/app/desk/page.tsx`, `QRCode.tsx` | Completed | 2026-10-10 |
| **RBAC-01** | Strict RBAC per PRD & Architecture: Removed global switcher, enforced 403 barriers, student desk denial, officer/treasurer authority separation | `auth-context.tsx`, `layout.tsx`, `page.tsx`, `login/page.tsx`, `signup/page.tsx`, `me/page.tsx`, `desk/page.tsx` | Completed | 2026-10-10 |
| **RBAC-02** | Separate Role Dashboards: Officer Operations Dashboard (Door QR Scanner, Events, Merch variants, Tasks) vs Treasurer Financial Audit Dashboard (Claims queue, Invariant 9 safeguard, Cashbook, Dues audit, Handover capsule) | `OfficerDashboard.tsx`, `TreasurerDashboard.tsx`, `desk/page.tsx` | Completed | 2026-10-10 |
| **F.1** | Backend API Route Handlers & Prisma PostgreSQL wiring | `frontend/src/app/api/*`, `prisma/*` | Next Up | — |
