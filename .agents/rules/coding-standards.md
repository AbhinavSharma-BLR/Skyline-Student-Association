# .agents/rules/coding-standards.md — TypeScript and Module Conventions

> Read before writing any code. Rules are short and enforceable. Link to docs for detail.

**Authority:** [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) owns repo structure and API contracts.

---

## TypeScript

- Strict mode enabled (`"strict": true` in tsconfig). No `any` without explicit justification comment.
- Use `type` for data shapes, `interface` for extensible contracts. Do not mix arbitrarily.
- Prefer `unknown` over `any` when type is truly dynamic; narrow with Zod or type guards.
- Never use `// @ts-ignore` without a comment explaining why and a plan to remove it.
- All functions have explicit return types except trivial arrow functions where the type is obvious.
- Use `z.infer<typeof schema>` to derive TypeScript types from Zod schemas. Never define the same shape twice.

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files | kebab-case | `membership-service.ts` |
| React components | PascalCase | `MembershipCard.tsx` |
| Functions/variables | camelCase | `reserveTicket`, `amountPaise` |
| Constants | SCREAMING_SNAKE | `MAX_CLAIM_SIZE_BYTES` |
| Zod schemas | camelCase + `Schema` suffix | `reserveTicketSchema` |
| DB table names | snake_case | `membership_periods` |
| Enum values | matches DB check constraint | `'active_member'`, `'INFLOW'` |

## Module Organization

- `lib/schemas/` — all Zod schemas and shared TypeScript types. Import from here; do not inline schemas in handlers.
- `lib/services/` — domain logic. One file per domain (membership, sales, activities, claims, cashbook, reporting).
- `lib/auth/` — session and capability helpers only. No business logic.
- `lib/providers/` — payment and email adapter interfaces + implementations.
- `app/api/v1/` — thin Route Handlers: validate input, check auth, call service, return response. No business logic.
- `components/domain/` — Skyline-specific components. `components/ui/` — shadcn/ui primitives only.

## Service Boundaries

- Each service module exports named functions. No class-based services unless required by a library.
- Services receive an `actor` object (userId, roles) resolved by the Route Handler. Never accept `actorId` from the request body.
- Services do not import from `app/` or `components/`. They are pure domain logic with DB access.
- No circular imports between services.

## Shared Schemas

- All payment/status/role enum values are defined once in `lib/schemas/enums.ts` and imported everywhere.
- API request and response schemas are defined in `lib/schemas/api/[resource].ts`.
- No two files may independently define `PurchaseState` or `ClaimStatus` values.

## Error Handling

- Route Handlers return the standard error shape: `{ error: { code, message, fieldErrors? }, requestId }`.
- Services throw typed errors: `new SkylineError('SOLD_OUT', 'The final seat was just reserved.')`.
- Catch and map errors at the Route Handler boundary. Never let raw DB errors surface to the browser.
- Log errors with `requestId`; never log tokens, signed URLs or raw payloads.

## Dependency Discipline

- Do not add a new npm dependency without mentioning it and getting approval first.
- Prefer standard library and already-installed packages. Check `package.json` before adding.
- Lock file must always be committed. Do not run `npm install --no-package-lock`.

## No Unrelated Refactors

- When implementing a task, modify only the files required for that task.
- Do not reformat, rename or restructure files that are not part of the current change.
- If an unrelated improvement is noticed, file it as a separate task.

## Documentation Updates

- When an API contract changes (route, input schema, response shape), update `docs/ARCHITECTURE.md` in the same commit.
- When a UI component behaviour changes, update `docs/DESIGN_SYSTEM.md`.
- When a business rule changes, update `docs/PRD.md` and any affected rule files.

## No Fabricated Implementation Claims

- Do not mark a task complete unless the code is written, runs without errors and passes its acceptance test.
- Do not claim a test passes without running it and recording the output.
- Do not claim a deployment is working without verifying the smoke checks.
