# .agents/rules/frontend.md — Frontend Implementation Obligations

> Read before implementing any UI. References: [`docs/DESIGN_SYSTEM.md`](../../docs/DESIGN_SYSTEM.md).

---

## Design System

- Every screen must follow the colour tokens, typography, spacing and component specs in `docs/DESIGN_SYSTEM.md`.
- Use shared domain components (`MembershipCard`, `TicketPass`, `StatusBadge`, etc.) from `components/domain/`.
- Do not invent new component styles ad-hoc. Extend the design system and document the addition.
- Use canonical status labels from `docs/DESIGN_SYSTEM.md §12`. Never invent new status strings.

## Accessibility and Responsiveness

- Minimum 44×44px touch target for all primary interactive elements.
- All form fields must have a `<label>` element linked to the input.
- Visible keyboard focus: 2px coral outline on all focusable elements.
- WCAG AA contrast minimum: body text on panel background ≥ 4.5:1.
- Status indicators must have text labels alongside colour; never rely on colour alone.
- Mobile-first: P0 student flows must be usable at 360px. Test in browser devtools before marking done.
- `prefers-reduced-motion`: disable all animations and transitions when set.

## Async States

Every remote data view must implement all five states:
1. **Loading** — skeleton or spinner
2. **Empty** — `EmptyState` component with helpful message
3. **Error/Retry** — inline error with retry option; not only a toast
4. **Denied** — `PermissionState` component; no data leak in error message
5. **Populated** — full content

Do not render a view in only its populated state and call it done.

## Form Behaviour

- Preserve all entered form values on server-side validation failure.
- Show validation errors inline below each field, not only on final submit.
- Currency inputs: display as "₹" + number. Convert to paise on submit. Never submit or store floats.
- Disable submit button during submission; restore on error for retry.
- File upload: show selected file name and size; progress bar; reject invalid type/size client-side before upload attempt.
- Confirmation dialogs required for: approve claim, record payout, generate handover snapshot, publish announcement.

## Price and Permission Rules (Critical)

- **Never calculate authoritative prices in the browser.** Display the server-returned `amountPaise` and `pricingBasis` only.
- **Never check or derive roles client-side to enforce access.** The server enforces permissions. The browser may hide UI elements for UX, but the server must still authorize every action.
- Show "Member price applied" or "Regular price" using the `pricingBasis` field returned by the server.
- Reservation countdown is informational only. Server expiry controls availability.

## Financial Mutation Safety

- For any financial mutation (purchase, payout, claim approval): update the screen only after server confirms success.
- Do not optimistically display a confirmed ticket, active membership or paid claim before the server response.
- MutationButton: loading state during submission; error state on failure; success state only after server confirms.

## Secrets and Server Data

- Never import server-only environment variables (service role key, encryption key, webhook secret) in any file that runs in the browser or is part of a client component.
- Variables with `NEXT_PUBLIC_` prefix are safe for browser; all others are server-only.
- Do not store purchase IDs, token hashes or receipt paths in local storage or cookies directly.

## Announcements

- Render announcement bodies as escaped plain text. Never use `dangerouslySetInnerHTML` for announcement content.
