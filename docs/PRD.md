# Product Requirements Document

## Product

Build a multi-tenant Subscription Management and Revenue Operations Platform for organizations selling recurring products and services. It manages the commercial path from catalog configuration through subscription, billing, payment, and reporting while preserving financial history and tenant isolation.

## Users

Platform identities (`User`) differ from buyers (`Customer`). A user can belong to many organizations through an `OrganizationMembership`; all permissions are evaluated in the active organization.

| Persona | Primary needs |
| --- | --- |
| Organization Admin | Organization setup, memberships, roles, and authorized operations |
| Internal User | Day-to-day sales, support, catalog, and customer work per permission |
| Billing Manager | Invoicing, payments, refunds, collections, and billing reports |
| Sales Manager | Products, plans, quotations, subscriptions, and customer activity |
| Portal User | Later: restricted access to an explicitly linked customer |
| Read-only user | Reports and permitted records without mutation |

The first organization uses an explicit bootstrap flow that creates its initial Admin. Only an authorized Admin can create or invite Internal Users in that organization.

## Functional scope

### Foundation

- Email/password authentication with secure password hashing, expiring JWTs, active organization context, RBAC, and audit trail.
- Responsive navigation, dashboard shell, accessible forms, and reliable loading/error states.

### Commercial master data

- Customers: business or individual, contacts, typed addresses, currency, status, and tenant-scoped customer numbers.
- Catalog: products, variants/SKUs, attributes, values, internal cost, and status. Selling prices belong to pricing.
- Plans: subscription offerings containing product/variant items, quantity constraints, lifecycle options, and effective-dated prices by currency and billing period.
- Discounts and taxes: configurable backend-evaluated rules snapshotted when applied.

### Revenue operations

- Quotation templates and issued quotations with validity, snapshots, an independent quotation lifecycle, and controlled conversion to subscription.
- Subscriptions with explicit status commands, commercial snapshots, amendments, business-event timeline, and an optional source quotation reference.
- Editable invoice drafts and immutable finalized documents.
- Multiple payments per invoice initially; separate refunds; later gateway transactions and credit notes.
- Reports for active subscriptions, revenue, payments, overdue invoices, customer revenue, subscription growth, and plan performance.

## Core business rules

1. Every business request has an active organization verified from membership; client-provided tenant IDs never authorize access.
2. A user is never a customer.
3. A plan has effective-dated prices; a used price is never overwritten.
4. Subscription and invoice lines snapshot commercially relevant facts.
5. Subscription lifecycle changes are commands that record amendment/event history.
6. Finalized invoice financial values cannot be freely edited; corrections use void/replacement or credit notes.
7. Payments and refunds are separate immutable facts; partial settlement is supported.
8. Money uses decimal arithmetic and explicit currency; the frontend cannot authoritatively calculate totals.
9. Business numbers are tenant-scoped and generated atomically.
10. Audit logs record actor/resource changes separately from business lifecycle events.
11. Quotation and subscription are separate aggregates. A quote follows `DRAFT → ISSUED → ACCEPTED | REJECTED | EXPIRED | CANCELLED`; acceptance may create a subscription. Subscription states never include `QUOTATION`.
12. Price/tax effective ranges use start-inclusive, end-exclusive intervals. Organization timezone governs business dates, scheduled lifecycle work, and reporting-day boundaries.
13. Financial commands use idempotency protection from their first release. Invoice settlement projections are derived from immutable financial facts and are never independent financial truth.

## Non-functional requirements

Secure authentication, RBAC, validation, tenant isolation, safe errors, no sensitive logs, responsive accessible UI, pagination, deliberate indexes, maintainable modules, transactionally safe financial operations, and support for thousands of subscriptions. Future AI/KG readiness comes from clean identities and relationships, not current AI infrastructure.

## Deferred scope

Microservices, AI/RAG/Neo4j, Redis/BullMQ, Kafka, Kubernetes, payment gateways, SSO/OAuth, password reset/email verification, analytics warehouse, CI/CD, and cloud deployment are deferred until a specific need justifies them.

## Success measures

- No tenant can read or mutate another tenant's data.
- Price changes never alter existing subscription terms or finalized invoices.
- An invoice supports partial payment, full payment, and refund without rewriting prior facts.
- Unauthorized operations fail consistently.
- Critical transitions and financial operations are auditable and atomic.
