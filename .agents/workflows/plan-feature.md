# .agents/workflows/plan-feature.md — How to Plan a Feature

> Use before implementing any non-trivial feature. Produces a plan for user review.

**Trigger:** Asked to plan or design a feature before coding it.

---

## Required Context

- [ ] Read `brain.md`.
- [ ] Read the relevant requirement IDs in `docs/PRD.md`.
- [ ] Read `docs/ARCHITECTURE.md` for existing schema and API patterns.
- [ ] Read `docs/DESIGN_SYSTEM.md` for UI patterns.
- [ ] Read relevant rule files in `.agents/rules/`.

## Steps

1. **State the requirement** in one sentence. Reference the FR or R ID from `docs/PRD.md`.

2. **Identify impacted layers:**
   - Database: new tables, migrations, constraints, indexes needed?
   - API: new endpoints or changes to existing ones?
   - Services: new business logic functions?
   - UI: new pages, components or states?

3. **Check for conflicts:** Does this feature conflict with any existing decision in `docs/DECISIONS.md`?

4. **Draft the plan** with:
   - Files to create or modify.
   - DB changes (entities, fields, constraints).
   - API endpoint shape (method, route, input, output).
   - Business logic and edge cases.
   - Security checks required.
   - Tests required.

5. **Present plan to user for approval.** Do not write code until approved.

6. **After approval:** Follow `implement-feature.md` workflow.

## Expected Output

- A written plan (Markdown format).
- List of files to be created/modified.
- List of acceptance criteria to verify after implementation.
