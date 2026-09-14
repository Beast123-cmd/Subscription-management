# ADR 001: Finalized Design Amendments

## Context

The architecture review approved the modular-monolith design but identified eight items that needed explicit, enforceable decisions before business-schema implementation.

## Decisions

1. Quotation is a separate aggregate, not a subscription state. Quote lifecycle: `DRAFT → ISSUED → ACCEPTED | REJECTED | EXPIRED | CANCELLED`. Accepted quotes may create subscriptions with `source_quotation_id`.
2. Subscription lifecycle: `DRAFT → CONFIRMED → ACTIVE`, with `PAUSED`, `CANCELLED`, `EXPIRED`, and `CLOSED` as explicit later transitions. No generic status mutation.
3. Effective date intervals are start-inclusive/end-exclusive: `[effective_from, effective_until)`. `NULL` end means open ended.
4. Monetary persistence uses `NUMERIC(19,4)` plus currency code. Currency minor-unit/display precision and calculation/rounding policy are centralized before billing.
5. Tenant business numbers use transactional `organization_sequences`; `MAX`, `COUNT`, and in-process counters are prohibited.
6. Payment/refund commands require idempotency from their first release. Payment/refund rows are facts; invoice settlement fields are derived projections when persisted.
7. High-risk tenant relationships use composite tenant-aware foreign keys in addition to service-level ownership checks.
8. `organizations.timezone` is required and uses an IANA timezone. It governs business-calendar dates, billing periods, reporting dates, and scheduled transitions.

## Consequences

The schema and API require quotation states, `source_quotation_id`, organization timezone, composite tenant references, sequence/idempotency infrastructure at the appropriate phase, and centralized financial policy. This introduces a small amount of deliberate schema complexity in exchange for preventing cross-tenant references, ambiguous price boundaries, duplicate financial commands, and conflicting lifecycle models.
