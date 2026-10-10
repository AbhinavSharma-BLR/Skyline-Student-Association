# docs/TEAM_OWNERSHIP.md — Four-Person Team Ownership

**Owner of this file:** Backend Developer (shared planning document — any update requires all four teammates to be notified)
**Last updated:** 2026-10-10
**Status:** Planning only — no application code exists yet.

> This is the team coordination bible. Read it before every coding session.
> When in doubt about who owns what: check this file first.

---

## 1. Four Ownership Lanes

### A — DATABASE DEVELOPER

**Activation phrase:** `"I am doing database"`

**Owns (sole authority):**
- `database/prisma/schema.prisma` — all model definitions including Better Auth models
- `database/prisma/migrations/**` — complete migration sequence; only DB dev commits new migrations
- `database/prisma/seed.ts` — seed strategy and demo data
- `database/scripts/**` — database utilities and diagnostics
- `database/README.md` — evaluator guide for database subsystem
- `docs/progress/database.md` — own progress log

**Does NOT own:**
- UI of any kind
- Route handlers
- Better Auth runtime config (`lib/auth/auth.ts`)
- Payment or email adapters
- Business HTTP authorization logic
- The `lib/prisma.ts` singleton (Backend owns that file; DB dev owns what it connects to)

**Key responsibilities:**
- One developer controls the migration sequence — no two teammates commit migrations independently
- Atomic transaction support: defines locking primitives, Backend wires them into services
- All financial formulas validated against PostgreSQL (paise, BigInt, no float)
- Custom CHECK constraints via raw SQL migrations (Prisma cannot express these natively)
- Demo seed idempotent: upsert-only, no hardcoded real passwords

---

### B — BACKEND + AUTH DEVELOPER

**Activation phrase:** `"I am doing backend"`

**Owns (sole authority):**
- `lib/auth/auth.ts` — Better Auth instance config
- `lib/auth/session.ts` — requireAuth(), requireRole(), requireOwner(), requireActivityStaff()
- `lib/auth/client.ts` — Better Auth browser client (shared by both frontends — owned here)
- `lib/prisma.ts` — Prisma singleton
- `lib/services/**` — all domain services
- `lib/providers/**` — payment and email adapter interfaces + demo/test implementations
- `lib/schemas/**` — shared Zod request/response schemas and status enums
- `lib/api/errors.ts` — SkylineError, handleApiError
- `lib/env.ts` — startup environment variable validation
- `app/api/**` — all Route Handlers (thin HTTP layer only)
- `app/api/auth/[...all]/route.ts` — Better Auth handler
- `app/api/v1/internal/**` — job runner endpoint
- `tests/integration/api/` — API-level integration tests
- `tests/integration/services/` — service-level tests
- `package.json` + `package-lock.json` — dependency manifest owner
- `next.config.ts` — server config, security headers
- `.env.example` — environment variable template
- `middleware.ts` — session cookie check and route guard
- `docs/progress/backend.md` — own progress log

**Does NOT independently edit:**
- `database/prisma/schema.prisma` — must submit a written DB dependency request to DB Developer
- `database/prisma/migrations/**`
- Frontend pages or visual components
- Database-owned transaction function definitions

---

### C — STUDENT FRONTEND DEVELOPER

**Activation phrase:** `"I am doing student frontend"`

**Owns (sole authority):**
- `app/(public)/**` — public-facing pages
- `app/(auth)/**` — /login, /signup
- `app/(member)/me/**` — /me/membership, /me/passes, /me/orders, /me/contributions, /me/updates
- `components/public/**`
- `components/student/**`
- `components/ui/**` — shadcn/ui primitives and base design tokens
- `app/globals.css` — global styles and CSS custom properties
- `tailwind.config.ts` — design token config
- `app/layout.tsx` — root layout
- `tests/e2e/student/`
- `docs/progress/student-frontend.md`

**Does NOT own:**
- `app/api/**`
- `database/**`
- `app/(desk)/**`
- `components/desk/**`

---

### D — MANAGEMENT FRONTEND DEVELOPER

**Activation phrase:** `"I am doing admin frontend"` or `"I am doing management frontend"`

**Owns (sole authority):**
- `app/(desk)/desk/**` — all Club Desk pages
- `components/desk/**` — management components
- `components/shared/**` — reusable admin tables, drawers, panels
- `tests/e2e/management/`
- `docs/progress/management-frontend.md`

**Does NOT own:**
- `app/api/**`
- `database/**`
- `components/ui/**` — import only
- `tailwind.config.ts` — import only
- `app/(public)/**` or `app/(member)/**`

---

## 2. File Ownership Map

> All paths are planned. No application code exists yet.

### Sole-Ownership Files

| File / Directory | Owner |
|---|---|
| `database/prisma/schema.prisma` | DB |
| `database/prisma/migrations/**` | DB |
| `database/prisma/seed.ts` | DB |
| `database/scripts/**` | DB |
| `database/README.md` | DB |
| `lib/auth/auth.ts` | BE |
| `lib/auth/session.ts` | BE |
| `lib/prisma.ts` | BE |
| `lib/services/**` | BE |
| `lib/providers/**` | BE |
| `lib/api/errors.ts` | BE |
| `lib/env.ts` | BE |
| `app/api/**` | BE |
| `next.config.ts` | BE |
| `middleware.ts` | BE |
| `app/(public)/**` | SF |
| `app/(auth)/**` | SF |
| `app/(member)/me/**` | SF |
| `components/public/**` | SF |
| `components/student/**` | SF |
| `app/(desk)/desk/**` | MF |
| `components/desk/**` | MF |
| `tests/integration/db/**` | DB |
| `tests/integration/api/**` | BE |
| `tests/integration/services/**` | BE |
| `tests/e2e/student/**` | SF |
| `tests/e2e/management/**` | MF |

### Shared Files — Single Designated Owner

| File / Directory | Owner | Notes |
|---|---|---|
| `package.json` + lockfile | BE | Add deps only with owner's approval |
| `.env.example` | BE | Owner adds vars; all fill own values |
| `next.config.ts` | BE | Server config |
| `middleware.ts` | BE | Route guards |
| `app/layout.tsx` | SF | Root layout |
| `app/globals.css` | SF | CSS custom properties |
| `tailwind.config.ts` | SF | Design tokens |
| `components/ui/**` | SF | MF imports only |
| `lib/auth/client.ts` | BE | Both frontends import only |
| `lib/schemas/**` | BE | Both frontends import enums and types only |
| `components/shared/**` | MF | SF imports if needed |
| `docs/TASKS.md` | BE (integrator) | All update own progress log; BE consolidates |
| `brain.md` | BE (integrator) | BE consolidates phase gates |
| `docs/INTEGRATION_CONTRACT.md` | BE | Changes announced before adoption |

---

## 3. Auth Split

| Concern | Owner |
|---|---|
| Password hashing, session creation | Better Auth (library) |
| Better Auth runtime config | BE |
| user/session/account/verification DB tables | DB |
| requireAuth(), requireRole() helpers | BE |
| Next.js middleware (route guards) | BE |
| Login / signup UI | SF |
| Desk login redirect UX | MF |
| Auth browser client source | BE (import only by SF and MF) |

---

## 4. Dependency Request Format

When your work is blocked by another lane, post this in your progress log:

```
DEPENDENCY REQUEST
From: [your lane]
To: [target lane]
Date: [HH:MM]
Blocking task: [task ID]
What I need: [precise description]
Expected interface: [type signature, response shape, or migration field]
Acceptance condition: [how you will verify readiness]
Urgency: [blocks me now / needed within N hours]
```

Notify the owner verbally. Do not implement the missing piece yourself.

---

## 5. Integration Rules

- No silent fallback to mock data. Real API failures show real errors.
- Mocks behind `USE_MOCK_DATA=true` flag only. Removed before final demo.
- Status enums imported from `lib/schemas/`. Never defined locally.
- Money is integer paise in all cross-layer data. Display rounding is presentation only.
- Timestamps are UTC ISO 8601 across all APIs. Display in Asia/Kolkata at UI layer.
- No Prisma records returned directly as API responses.
- Contract changes announced before dependent roles adopt them.

---

## 6. Progress Logs

```
docs/progress/database.md           ← DB Developer
docs/progress/backend.md            ← Backend Developer
docs/progress/student-frontend.md   ← Student Frontend Developer
docs/progress/management-frontend.md ← Management Frontend Developer
```

Entry format:
```
## [HH:MM] P{phase}-{lane}-{N} — Short description
Status: DONE / IN_PROGRESS / BLOCKED
Evidence: [test output / URL / observation]
Next: [next task ID]
Blockers: [dependency request if any]
```

BE integrator consolidates into brain.md at each phase gate.

---

## 7. Non-Negotiables (All Lanes)

1. Better Auth handles all password operations. No custom hashing anywhere.
2. Public signup never assigns officer or treasurer roles.
3. Server calculates all prices, roles and stock counts. Browser sends intent only.
4. Capacity and inventory cannot be oversold — DB + service layer enforce this.
5. QR check-in succeeds exactly once per ticket per activity.
6. Receipts are private — streamed via authenticated Route Handler only.
7. Claim approval does not reduce cash. Only payout reduces cash.
8. Demo payments are visibly labelled ("SIMULATED PAYMENT") in the UI.
9. Secrets are never committed, logged, or sent to the browser.
10. Historical purchase prices and confirmed cashbook entries are immutable.
