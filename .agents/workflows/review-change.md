# .agents/workflows/review-change.md — How to Review a Change

> Use when reviewing a PR, a teammate'"'"'s code or your own completed implementation.

**Trigger:** A code change is complete and needs review before merging.

---

## Checklist

### Correctness
- [ ] Business logic matches the requirement in `docs/PRD.md`.
- [ ] State transitions match those defined in `docs/ARCHITECTURE.md §6`.
- [ ] Financial formulas are correct and use integer paise (no float).
- [ ] Concurrency scenarios are handled (capacity lock, sorted variant lock, idempotency).

### Authorization
- [ ] Every Route Handler checks session, role and ownership.
- [ ] No business logic derives permissions from client-supplied values.
- [ ] Server-side authorization exists even where the UI hides the action.
- [ ] Negative permission tests are present for the changed routes.

### Data Integrity
- [ ] DB operations use transactions where multiple rows must succeed together.
- [ ] No deletion of confirmed purchases, cashbook entries or snapshots.
- [ ] Constraints and foreign keys present for new entities.

### Security
- [ ] No secrets in client bundles or logged output.
- [ ] Receipt access goes through the signed URL endpoint.
- [ ] Webhook signature verified before processing.
- [ ] Demo-confirm endpoint gated on PAYMENT_MODE.

### Frontend
- [ ] All five async states implemented (loading, empty, error, denied, populated).
- [ ] Form values preserved on server validation failure.
- [ ] No authoritative prices or permissions calculated in the browser.
- [ ] Financial mutations update screen only after server confirmation.

### Code Quality
- [ ] No `any` without justification.
- [ ] Shared Zod schemas used; no inline schema duplication.
- [ ] Error responses use standard format with stable error code.
- [ ] No unrelated refactors in this change.
- [ ] Commit messages follow AGENTS.md §4 format.

### Documentation
- [ ] `docs/ARCHITECTURE.md` updated if API contract changed.
- [ ] `docs/DESIGN_SYSTEM.md` updated if component behaviour changed.
- [ ] `docs/TASKS.md` task marked complete with evidence.
- [ ] `brain.md` updated.

## Expected Output

- A review summary: APPROVED, APPROVED_WITH_NOTES or CHANGES_REQUIRED.
- Specific line-level comments for any issues found.
- Confirmation that tests were reviewed (not just that they exist).
