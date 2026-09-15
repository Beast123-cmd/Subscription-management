# RevOps frontend redesign plan

Status: proposed design and implementation plan, 15 September 2026.

## 1. Product direction

Build a calm, precise workspace for managing recurring business. The visual idea is a modern accounting desk: warm neutral surfaces, ink typography, a restrained indigo accent, and clear document structure. Financial information should feel legible and dependable; everyday actions should feel quick and forgiving.

The goal is measurable usability and a recognizable identity. “Best in the world” is an ambition, not a claim we can validate without user testing. Optimize for creating an invoice, understanding what is owed, and finding a customer without training.

Scope: frontend redesign planning. This document does not mark existing features complete or authorize a production rollout. Retain the existing React/TypeScript/Tailwind stack and component foundation; no framework migration is needed.

## 2. Current UI assessment

Evidence: repository inspection plus screenshots already supplied in this conversation. A fresh browser walkthrough at desktop and mobile sizes remains an implementation gate; screenshots from earlier turns may precede recent changes.

| Finding | Evidence | Consequence | Priority |
| --- | --- | --- | --- |
| Creation forms ask for raw IDs | Invoice, quotation, subscription, payment and refund list pages | Users cannot discover valid related records naturally | P0 |
| Some actions announce success without changing records | Invoice detail/list finalization and void handlers; plan edit handlers | Users can believe work was saved when it was not | P0 |
| Reports still contain hardcoded claims | ReportsPage includes a fixed +14.2% comparison | Financial UI cannot be trusted | P0 |
| Dashboard overdue logic does not match invoice lifecycle | Dashboard filters status OVERDUE; backend uses DRAFT/FINALIZED/VOID | Incorrect empty/zero metrics | P0 |
| Overdue amount uses one invoice | Dashboard uses overdueInvoices[0] | Misleading aggregate | P0 |
| Forms mostly rely on placeholders | Newly added inline create forms | Field meaning disappears when typing; inaccessible names | P1 |
| Tiny supporting text is widespread | 10–11px classes in details/dashboard | Hard to scan and read comfortably | P1 |
| Generic table sorts decimal strings lexically | DataTable string localeCompare fallback | Financial amounts may sort incorrectly | P1 |
| Table pagination does not clamp after filtering | DataTable retains currentPage | A populated result can appear empty | P1 |
| Clickable rows lack native link semantics | DataTable and dashboard click handlers | Keyboard access and opening new tabs suffer | P1 |
| Theme is mostly scattered utility colors | styles.css only establishes font and scrollbars | Visual changes are difficult to maintain consistently | P2 |

Strengths to preserve: shared table/input/button components, recognizable sidebar organization, permission wrappers, currency/date display helpers, React Query, and a largely consistent neutral palette. Existing mock notifications and audit entry points have already been removed; keep audit storage deferred.

## 3. Visual system: “Quiet Precision”

Use light mode as the first complete release. Dark mode follows only after all critical states work in the light theme.

| Token | Starting direction | Usage |
| --- | --- | --- |
| Canvas | #F6F7F9 | Application background |
| Surface | #FFFFFF | Forms, tables, documents |
| Primary text | #182230 | Headings and values |
| Secondary text | #526174 | Supporting explanations |
| Accent | #4F46E5 | Primary action, focus, selected navigation |
| Border | #DDE2E8 | Quiet structural separation |
| Success | Deep green + pale green surface | Confirmed outcome |
| Warning | Dark amber + pale amber surface | Attention required |
| Danger | Deep red + pale red surface | Destructive action/error |

These are candidate colors; verify contrast for each actual foreground/background pair before shipping. Never communicate status by color alone.

- Typography: keep the existing sans stack; verify whether Inter is actually loaded. Use 14–16px body text, 13–14px labels/table text, 24–28px page titles, and 28–36px key amounts. Avoid decorative all-caps descriptions.
- Spacing: a 4px base scale; 16–24px between related groups and 32px between sections. Use space to express grouping rather than wrapping every element in another card.
- Shape: 8px inputs/buttons, 12px cards, subtle borders. Reserve elevation for menus, dialogs and drawers.
- Density: comfortable defaults, optional compact tables later. Target 44px interactive controls for touch; dense desktop row actions must still have generous hit areas.
- Icons: reuse Lucide, consistent stroke/size. Pair important actions with text.
- Motion: short 120–180ms transitions for state changes; honor reduced-motion preferences. No animation of authoritative financial values while reading or submitting.
- Distinctive detail: a document-inspired invoice summary with aligned totals, a thin accent rule, and restrained typographic hierarchy. Avoid unrelated gradients and decorative charts.

## 4. Navigation and application shell

Keep familiar resource names, grouped by task:

- Workspace: Overview, Customers.
- Commercial: Products, Plans, Subscriptions, Quotations.
- Billing: Invoices, Payments, Refunds.
- Insights: Reports, exposed only with real data and permission.
- Administration: Users, Roles, Taxes & Discounts, Organization settings.

Organization switcher stays prominent. User menu shows account and sign out. Do not show unavailable notification or audit functionality as working features.

Use one page title and optional parent breadcrumbs; remove duplicate Dashboard > Dashboard paths. Put one clear primary action at the right of the page heading. Global create/search can be added once resource flows are complete; do not label a navigation-only palette as universal record search.

Persist filters in URL parameters. Detail links retain return context. Switching organization clears selections and open financial forms, preventing submission of a previous organization's draft.

## 5. Reference experience: invoice editor

The invoice editor sets the standard for the redesign because it exercises relationships, money, validation, permissions and lifecycle behavior.

Desktop layout: wide editing area plus a narrower summary column. Mobile: one column with summary before final review; sticky actions must never cover focused fields or errors.

1. Select a customer by name, email or customer number. Show currency and billing identity alongside the selection. No UUID entry.
2. Enter labeled issue/due dates with organization-local defaults.
3. Add multiple lines with description, quantity and unit price. Allow row removal while draft.
4. Choose permitted active tax/discount rules by name and percentage. Clearly distinguish a fixed adjustment from a percentage rule.
5. Show subtotal, discount, taxable amount, tax and total. Server calculation is authoritative; any local estimate must be labeled until confirmed.
6. Save draft with visible pending/error state. On success open the saved invoice and expose its business number.
7. Finalize through a review step stating that financial values become immutable. Only show success after the server confirms.
8. Offer Record payment with the invoice already selected and the current outstanding balance visible.

Dependencies: safe draft line update/removal APIs, defined rounding, validated discount bounds, accurate settlement projection, and rule snapshots. If unavailable, scope the UI to supported operations and record the gap. Do not imply a full editor works simply because draft creation returns 201.

## 6. Screen-by-screen changes

| Screen | Proposed experience | Acceptance condition |
| --- | --- | --- |
| Login/context | Compact welcome form, visible labels, clear session errors; auto-enter sole eligible organization | User reaches permitted workspace without an empty selector |
| Overview | Four meaningful metrics and a “Needs attention” list linking to filtered records | Zero, unavailable and failed data are distinct; currencies never combined |
| Customers | Searchable list; create drawer; detail tabs for overview, contacts, billing and subscriptions | Create/select a customer without IDs; only real actions appear |
| Products | Type selector, internal cost label, description; variants on detail screen | GOODS and SERVICE both supported; cost is not confused with selling price |
| Plans | Basics, items and effective prices as clearly separated sections | A plan can be configured sufficiently to create a subscription |
| Subscriptions | Customer/plan selectors, eligible price, billing period and dates; review before creation | Selected pricing is visible; unsupported combinations explain why |
| Quotations | Document editor with multiple lines, validity and totals; separate lifecycle actions | Issuing/accepting updates the persisted record and refreshes the page |
| Invoices | Reference editor and readable immutable document detail | Draft → finalization → payment works end to end |
| Payments | Invoice selector, customer context, balance, method and reference; receipt detail | Retry cannot create a second financial record |
| Refunds | Start from a payment; show remaining refundable amount; amount/reason confirmation | Concurrent refunds cannot exceed the payment; errors preserve input |
| Taxes/discounts | Simple list, labeled percentage form and archive action | Selected rules remain correctly represented on historical invoices |
| Users/roles | Real membership list, clear scope; permission-aware admin actions | No invitation or role change is advertised before its API works |
| Reports | Period/currency filters, metric definitions, useful table and export | All numbers originate from supported APIs; no fixed sample growth claims |

Use drawers for short resource creation, full pages for documents and subscription configuration, and dialogs for financial confirmation. Avoid a generic dynamic form builder; share field primitives and submission behavior, keeping domain forms explicit.

## 7. Interaction contract

- Every field has a persistent label and programmatically associated help/error text.
- Related records use searchable selectors showing business names and numbers; handle loading, failure, no matches and no eligible records.
- Financial submissions keep one idempotency key per unchanged operation across retries. Backend rejects key reuse with a different payload and serializes competing financial writes.
- Disable repeated submit during an active request; keep input on failure. A timeout means outcome unknown until reconciled, not permission to create a fresh payment.
- Server validation appears beside fields where possible, with a focusable summary for multiple errors.
- After mutation invalidate affected detail/list/summary caches. Never show successful persistence based only on clicking a button.
- Distinguish first-use empty state, filtered no-results, missing permissions, unavailable feature, and network failure.
- Tables use correctly typed sorting, reliable pagination, native record links and keyboard-operable row actions. Remove selection controls where no bulk action exists.
- Cache keys include organization identity. UI permission checks mirror the server; hiding a button does not authorize a request.

## 8. Accessibility and responsive behavior

Target WCAG 2.2 AA as the implementation acceptance baseline, with a separate standards review during QA. Verify keyboard-only navigation, visible focus, label associations, error announcements, contrast, zoom/reflow, dialog focus containment/return and reduced motion.

Review at 360px, 768px, 1280px and 1440px, plus 200% zoom. Mobile tables show priority columns and a clear details link; preserve access to remaining values without truncating critical money fields. Keep table scrolling contained rather than causing whole-page horizontal scrolling.

## 9. Implementation sequence

| Milestone | Deliverable | Exit gate |
| --- | --- | --- |
| A: Baseline | Browser screenshots, API/action inventory, fake-success and data-contract fixes | Every displayed action has a documented real behavior |
| B: Design foundations | Tokens, typography, shell, fields, buttons and table improvements | Keyboard and responsive QA on shared components |
| C: Reference flow | Invoice editor/detail and payment/refund forms | Real workflow verified in an isolated test environment |
| D: Commercial flows | Customers, products, complete plan setup, subscriptions and quotations | Users can create all prerequisite records through UI |
| E: Administration/insights | Tax/discount management, accurate reports; user management when API available | Permission matrix and data definitions verified |
| F: Release polish | Empty/error states, accessibility, performance and regression pass | Acceptance checklist below passes |

Each milestone should have its own conventional commit/PR, screenshots and an honest list of remaining gaps. Do not merge a cosmetic change with an unreviewed financial behavior change. Keep current work intact and avoid new dependencies unless existing components cannot meet accessibility/interaction requirements.

## 10. Validation and release criteria

- Task walkthroughs: create customer; configure product/plan/price; create subscription; create quote; draft/finalize invoice; record partial payment; record permitted refund.
- Admin and restricted-user walkthroughs, including organization switching and expired sessions.
- API failures preserve input and never turn into successful toasts or zero-valued metrics.
- Financial tests cover decimals, rounding, duplicate submissions, concurrent refunds and currency separation before enabling the corresponding UI.
- Frontend typecheck, lint and production build pass. Add focused interaction/contract tests for critical workflows, not snapshot tests for every decorative component.
- Browser visual inspection at target sizes with empty, populated, loading, error and restricted states. Use synthetic records only in isolated fixtures, never represented as live tenant activity.
- Ask representative users to complete the task walkthroughs without guidance. Initial targets: no UUID copying, no dead action buttons, all money actions have visible outcomes, and at least 4 of 5 participants complete the invoice task unaided. Establish timing baselines before claiming speed improvements.

## 11. Immediate next implementation

Start with baseline correctness plus the shared shell/field/table foundations, then deliver the invoice editor as the first complete reference workflow. A visual redesign alone cannot correct incomplete API contracts, stale balances or placeholder lifecycle actions. Keep those dependencies visible in the work tracker.
