# Detailed Build Plan

## Delivery rules

Complete and verify one phase before starting the next. Every phase produces a reviewable increment and updates the relevant documentation. Before implementation of a domain, define its invariants, permissions, tenant ownership, lifecycle, constraints/indexes, API contract, transaction boundary, and historical-data behavior.

| Phase | Deliverable            | Dependencies | Definition of done                                                                                       |
| ----- | ---------------------- | ------------ | -------------------------------------------------------------------------------------------------------- |
| 0     | Architecture agreement | None         | Documents approved; unresolved choices recorded as ADRs                                                  |
| 1     | Monorepo foundation    | 0            | pnpm/Turbo workspace, API/web apps, Neon environment template, health endpoint, lint/type/build checks   |
| 2     | Database foundation    | 1            | Prisma package/client, Neon pooled/direct URL configuration, migration workflow                          |
| 3     | Identity and tenancy   | 2            | Organization/global User/Membership migration, first-Admin bootstrap, tenant query foundation            |
| 4     | Authentication/context | 3            | Password login, JWT, active organization selection, auth/tenant guards, safe errors                      |
| 5     | RBAC                   | 4            | Roles/permissions/membership assignment, permission guard, Admin policy, audit hooks                     |
| 6     | Customers              | 5            | Customer/contact/address CRUD, tenant numbers, archive policy, validation, pagination                    |
| 7     | Catalog                | 5            | Products, variants, attributes, ownership validation, archive behavior                                   |
| 8     | Plans/pricing          | 7            | Plan/items/prices, start-inclusive/end-exclusive validation, price preservation, decimal/currency policy |
| 9     | Subscriptions          | 6+8          | Creation, item snapshots, command state machine, amendments/events, transactions; no quotation state     |
| 10    | Quotations             | 6+8+9 design | Templates and issued quotes; independent quote states and controlled conversion to subscription          |
| 11    | Invoices               | 9            | Draft creation, calculation service, finalized snapshots/immutability, due dates, audit                  |
| 12    | Payments/refunds       | 11           | Partial payments, derived settlement projection, payment numbers, refund rules, required idempotency     |
| 13    | Discounts/taxes        | 11           | Effective rules, calculation order, centralized rounding, snapshots                                      |
| 14    | Reports                | 11+12        | Authorized/filterable operational reports from PostgreSQL queries                                        |
| 15    | Web completion         | Mature APIs  | Feature pages, forms, queries, accessibility, dashboard, organization switcher                           |
| 16    | Hardening              | Prior phases | Critical integration tests, security review, query plans/indexes, seed/demo data, documentation cleanup  |

## Phase 1: repository foundation

Create only the workspace and development path. The API responds to `GET /health`; the web app renders a minimal shell; shared Neon branch configuration and `.env.example` document variables without values. Share TypeScript/lint/format configuration through `packages/config`.

Verify a fresh install, local startup, API health, web build, API build, lint, and typecheck. Do not add Prisma models, domain modules, a UI component library, or authentication in this phase.

## Phases 2–5: platform foundation

Database setup establishes the `packages/database` Prisma-owner workspace, schema validation, client-generation command, direct versus pooled Neon URL convention, and reproducible migration commands. It contains no business models or migrations. Identity remains intentionally narrow: organization, global user, membership, timestamps, statuses, unique keys, and first-Admin bootstrap. Authentication adds password hashing, JWT lifecycle, and active organization context. RBAC introduces only permissions required by built domains and seeds system permissions/roles deterministically.

## Domain build playbook

Before each domain, create a short domain note/ADR answering purpose; tables and ownership; API operations; permissions; state machine; constraints/indexes; transaction boundary; snapshot/immutability rules; tests; and deferred edges. Then work in this order:

1. Migration and Prisma models with constraints/indexes.
2. Service-level ownership and invariant checks.
3. Zod DTOs, controller routes, and API contract.
4. Permission/tenant guard integration and audit events.
5. Focused tests for corruption or data-leak failure modes.
6. Web queries/forms after API behavior is stable.

For plans, use start-inclusive/end-exclusive effective intervals and prevent overlap. For subscriptions, decide pricing/grandfathering and amendment effects; quotations remain a separate aggregate. For invoices, settle rounding and tax/discount order before code. For payments, define the derived invoice-balance projection and implement idempotency from the first command.

## Test strategy

Unit-test calculations and state transitions. Integration-test tenant isolation, membership/RBAC, price history, invoice finalization/immutability, partial payment, refunds, business-number concurrency, and rollback. Add contract/end-to-end tests for high-risk workflows after they exist. Tests must exercise meaningful failures rather than coverage alone.

## Decisions required before relevant phases

| Decision                                                                                     | Needed by   |
| -------------------------------------------------------------------------------------------- | ----------- |
| Email normalization, slug rules, organization timezone, first-Admin bootstrap                | Phase 3     |
| Active-organization transport and JWT refresh policy                                         | Phase 4     |
| System versus tenant role model; portal-to-customer access link                              | Phase 5     |
| Plan vs item pricing, grandfathering/renewals; start-inclusive/end-exclusive price intervals | Phase 8     |
| Quotation/subscription relationship, independent states, and conversion rules                | Phase 9–10  |
| Tax/discount order, inclusive/exclusive tax, rounding, standalone invoices                   | Phase 11–13 |
| Payment balance projection, refund effects, credit-note first release scope                  | Phase 12    |

## First implementation task

Start Phase 1 after approval. Expected files are root workspace configuration, `apps/api`, `apps/web`, `packages/config`, `.env.example`, `.gitignore`, and Neon connection configuration. The result is a runnable foundation with no business schema or feature code. Docker is intentionally excluded from the initial build; it can be introduced later for isolated local testing or deployment needs.
