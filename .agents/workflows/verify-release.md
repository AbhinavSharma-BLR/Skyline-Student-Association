# .agents/workflows/verify-release.md — Pre-Release Checklist

> Run before demo or production deployment. Creating this checklist does not authorize deployment.

**Trigger:** All P0 tasks checked in `docs/TASKS.md`; deployment is imminent.

---

## Pre-Deployment Verification

### Code and Tests
- [ ] `npm run lint` passes with no errors.
- [ ] `npm run test:integration` passes — record output with date and environment.
- [ ] E2E test executed on deployed target — record output.
- [ ] Concurrency tests AT04 and AT10 executed against real DB.
- [ ] Permission tests AT14, AT15, AT16 pass.
- [ ] Financial fixture AT20 passes — sums match expected paise totals.

### Deployment
- [ ] All environment variables set in host dashboard (no real secrets in .env files committed).
- [ ] `supabase db push` or equivalent run on production DB.
- [ ] RLS confirmed active (test with anon key: should not return other users'"'"' private data).
- [ ] Demo-confirm endpoint disabled in production (`PAYMENT_MODE != demo`).
- [ ] HTTPS configured; redirects from HTTP.
- [ ] Supabase Storage: receipts bucket is private; product-images is public.

### Smoke Checks (from docs/TESTING.md §10)
- [ ] Home page loads (200 HTML).
- [ ] API returns membership periods (200 JSON).
- [ ] Signup + login works; session cookie set.
- [ ] Demo purchase flow completes end-to-end.
- [ ] Finance summary returns correct paise totals.
- [ ] Receipt upload and signed URL download work.
- [ ] Scanner: valid ticket returns ACCEPTED; invalid returns DENIED.

### Demo Readiness
- [ ] Demo accounts seeded (student, officer, treasurer, door staff).
- [ ] Demo sequence rehearsed per `docs/TESTING.md §16.3`.
- [ ] All demo/test payment endpoints clearly labelled in the UI.
- [ ] README setup instructions verified by a second person.
- [ ] Submission links confirmed working.

### Documentation
- [ ] Any unmet acceptance criterion documented (not labelled complete).
- [ ] `docs/TASKS.md` reflects actual completion status.
- [ ] `brain.md` updated with final phase status.

## Expected Output

- Completed checklist with each item marked pass/fail.
- Evidence for each test (command, output, date).
- A list of any known limitations or unmet criteria.
- Confirmation that the team has rehearsed the demo sequence.
