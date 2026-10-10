# .agents/workflows/update-project-memory.md — How to Update brain.md

> Run at the end of each work session or after completing a milestone.

**Trigger:** A task is completed, a blocker is resolved or a session is ending.

---

## Steps

1. Read the current `brain.md` completely.
2. Read `docs/TASKS.md` to see which tasks are now checked.
3. Check for any resolved blockers from the Blockers table.
4. Check for new open questions discovered during implementation.

## Update These Sections

| Section | When to update |
|---|---|
| Current Phase | When phase changes (documentation → implementation → testing → deployed) |
| Current Milestone | When milestone gate is passed |
| Next Three Actionable Tasks | After each task is completed |
| Blockers and Open Questions | When a blocker is resolved or a new one is discovered |
| Last Verified Checks | After any test is run or deployment smoke check is completed |

## Rules

- Do not duplicate specs from other docs. Link to them.
- Do not mark tasks or milestones complete unless they actually are.
- Do not remove blockers unless they are truly resolved.
- Add a date to every "Last Verified Checks" row.
- Update the `_Last updated:` line at the bottom of brain.md.

## Expected Output

- Updated `brain.md` with accurate current state.
- No fabricated completion claims.
- Commit: `docs(brain): update project memory after [milestone/task]`.
