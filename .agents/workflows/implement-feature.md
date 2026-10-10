# .agents/workflows/implement-feature.md — How to Implement a Feature Slice

> These are procedural guidelines, not automatically executable commands.
> Read and follow manually for each implementation task.

**Trigger:** Starting work on a task from `docs/TASKS.md`.

---

## Required Context Before Starting

- [ ] Read `brain.md` completely.
- [ ] Find the task ID in `docs/TASKS.md`; confirm it is P0 or all P0 tasks are done.
- [ ] Read the related requirement IDs in `docs/PRD.md`.
- [ ] Read the relevant section of `docs/ARCHITECTURE.md` (schema, API contract, transaction design).
- [ ] Read the relevant rule file in `.agents/rules/` for the task type (frontend / backend-api / database).

## Steps

1. **State your plan** before writing code. Name the files you will create or modify and what each change does. Wait for approval if any file already exists (per AGENTS.md §3).

2. **Implement a small vertical slice.** Complete one thin path through the system: migration → service → route handler → UI component. Do not build the entire feature UI before the backend exists.

3. **Write the code.** Follow all rule files. No magic numbers, no inline schemas, no business logic in route handlers.

4. **Verify locally.**
   - Run `npm run lint` — must pass.
   - Run integration tests relevant to the task: `npm run test:integration -- --grep <AT-ID>`.
   - For DB changes: confirm migration applies cleanly.
   - For API changes: test with a manual request (e.g., `curl` or API client).
   - Report exact commands and output.

5. **Check acceptance criteria** from the task row in `docs/TASKS.md`. Confirm each criterion is met.

6. **Update task status.** In `docs/TASKS.md`, check the task box `[x]` and add a note with evidence.

7. **Record decision if needed.** If you made an architectural choice not covered in `docs/DECISIONS.md`, add an ADR entry.

8. **Commit.** Follow AGENTS.md §4 commit format: `feat(scope): short description`.

9. **Update `brain.md`.** Update Next Three Tasks, Last Verified Checks and any resolved blockers.

## Stop Conditions

- Stop if you discover a design conflict with `docs/ARCHITECTURE.md` or `docs/PRD.md`. Document the conflict; do not silently resolve it.
- Stop if a migration would affect existing data in a breaking way. Report impact first.
- Stop if a dependency is needed. Request approval before installing.

## Expected Output

- Modified/created source files.
- Passing test output (command + result + date + environment).
- Updated `docs/TASKS.md` with checked task.
- Updated `brain.md`.
- New ADR in `docs/DECISIONS.md` if a significant choice was made.
