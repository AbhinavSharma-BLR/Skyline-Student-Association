# AGENTS.md — Project Rules for Skyline Student Association

> These rules MUST be followed at all times without exception.
> They apply to every task, feature, fix, or refactor in this project.

---

## 1. Code Quality

- Always write **clean, readable, well-structured code**.
- Every file, function, class, and complex block of logic **must include clear comments** explaining its purpose.
- Avoid magic numbers or hardcoded strings — use named constants or config variables.
- Keep functions small and focused — each function should do one thing.
- Remove dead code, unused imports, and leftover debug statements before finalizing any change.

---

## 2. File & Folder Structure

- Always place files in their **correct designated folder**. Do not dump files in the root.
- Follow this general structure (update as the project grows):

```
project root/
├── app/
│   ├── (public)/          # /, /events, /membership, /merch, /updates, /about
│   ├── (auth)/            # /login, /signup
│   ├── (member)/me/       # Student workspace
│   ├── (desk)/desk/       # Officer/Treasurer workspace
│   └── api/v1/            # Thin Route Handlers ONLY — no business logic
├── components/
│   ├── ui/                # shadcn/ui primitives
│   └── domain/            # Skyline-specific components
├── lib/
│   ├── auth/              # Session helpers, capability checks
│   ├── schemas/           # Zod schemas — define once, import everywhere
│   ├── services/          # Domain business logic (membership, sales, claims…)
│   └── providers/         # Payment and email adapter interfaces
├── prisma/
│   ├── schema.prisma      # Auth models + domain models (single file)
│   └── migrations/        # Prisma-managed migration history — committed
├── tests/
│   ├── integration/       # Real-DB state, transactions, concurrency tests
│   └── e2e/               # Core browser journey tests
├── docs/                  # All project documentation
├── .agents/
│   ├── rules/             # Specialized rule files (read before coding)
│   └── workflows/         # Repeatable procedures
├── brain.md               # Project memory — read first every session
├── README.md              # Setup guide
└── AGENTS.md              # This file
```

- If a new folder or structural change is needed, **discuss it first** before creating it.

---

## 3. Before Modifying Any File

- **Never modify an existing file without confirming with the user first**, unless the task explicitly says to do so.
- Before editing, state:
  - Which file(s) will be changed
  - What the change will do
  - Why it is needed
- Only proceed after the user approves.

---

## 4. Git Commits

- Every commit must have a **clear, descriptive commit message** following this format:

```
<type>(<scope>): <short description>

Examples:
  feat(auth): add JWT-based login flow
  fix(ui): correct navbar overlap on mobile
  refactor(api): extract validation into middleware
  docs(readme): update setup instructions
  style(components): format Button component
  chore(deps): update dependencies
```

- Commit types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`
- Never commit broken code or commented-out debug blocks.
- Never batch unrelated changes into a single commit.

---

## 5. General Agent Behavior

- **Ask before assuming.** If a requirement is unclear, ask for clarification instead of guessing.
- **Think before acting.** For any non-trivial task, briefly state the plan before executing it.
- **Report what was done.** After completing a task, summarize what was changed and why.
- Do not install new dependencies or libraries without mentioning them and getting approval.
- Do not change configurations (`.env`, build config, etc.) without explicitly stating the change.

---

## 6. Tech Stack (Confirmed — updated per ADR-012)

| Layer | Technology |
|---|---|
| Framework | Next.js App Router + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Local PostgreSQL (native install or Docker) |
| ORM / Migrations | Prisma ORM + Prisma Migrate |
| Auth | Better Auth (email/password; Prisma adapter; runs inside Next.js) |
| Storage | Local filesystem `uploads/receipts/` (outside `public/`) |
| Validation | Zod (shared schemas in `lib/schemas/`) |
| Email | Provider adapter (Resend / SendGrid / etc.) |
| Payment | Demo adapter (clearly labelled); optional test-provider |
| QR | QR generation + camera scanner library |
| Deployment | Persistent-runtime host (local demo, Railway, Fly.io, VPS) |

> ⚠️ Verify competition rules — external rules take precedence.
> ⚠️ Supabase services (Auth, Storage, hosted PostgreSQL, RLS) are NOT used. See ADR-012.

---

## 7. Specialized Rule Files

For domain-specific obligations, read these rule files before implementing in that area:

| Rule file | Read before implementing |
|---|---|
| [`.agents/rules/coding-standards.md`](./.agents/rules/coding-standards.md) | Any TypeScript code |
| [`.agents/rules/frontend.md`](./.agents/rules/frontend.md) | Any UI component or page |
| [`.agents/rules/backend-api.md`](./.agents/rules/backend-api.md) | Any Route Handler or service |
| [`.agents/rules/database.md`](./.agents/rules/database.md) | Any migration or DB query |
| [`.agents/rules/testing.md`](./.agents/rules/testing.md) | Any test or test claim |
| [`.agents/rules/security.md`](./.agents/rules/security.md) | Auth, storage, payments, webhooks |

Rules are **not automatically executed** — they are read and followed manually.

---

## 8. Documentation Index

| Document | Purpose |
|---|---|
| [`brain.md`](./brain.md) | Start here — current state, next tasks, blockers |
| [`docs/PRD.md`](./docs/PRD.md) | Product requirements and acceptance criteria |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Schema, API contracts, transaction design |
| [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md) | Visual design and screen specs |
| [`docs/TASKS.md`](./docs/TASKS.md) | 24-hour delivery backlog |
| [`docs/DECISIONS.md`](./docs/DECISIONS.md) | Architectural decision records |
| [`docs/TESTING.md`](./docs/TESTING.md) | Test strategy and acceptance evidence |
| [`docs/SECURITY.md`](./docs/SECURITY.md) | Security policy and role matrix |

---

_Last updated: 2026-10-10 — Skyline Student Association ERP_
