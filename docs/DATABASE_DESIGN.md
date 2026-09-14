# Database Design

## Principles

PostgreSQL is the operational source of truth. Prioritize tenant isolation, relational integrity, historical financial correctness, auditability, queryability, and practical extensibility. Use UUID primary keys, `TIMESTAMPTZ` for instants, `DATE` for pure organization-calendar dates, `NUMERIC(19,4)` for money, ISO-style currency codes, foreign keys, deliberate indexes, and tenant-scoped unique business numbers. Every organization has an IANA timezone such as `Asia/Kolkata`; it governs billing days, due-date interpretation, reporting-day boundaries, and scheduled lifecycle work.

## Target model

| Domain           | Target tables                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Identity/tenancy | `organizations`, `users`, `organization_memberships`                                                                   |
| RBAC             | `roles`, `permissions`, `membership_roles`, `role_permissions`                                                         |
| Customers        | `customers`, `customer_contacts`, `customer_addresses`                                                                 |
| Catalog          | `products`, `product_variants`, `product_attributes`, `product_attribute_values`, `product_variant_attribute_values`   |
| Plans            | `plans`, `plan_items`, `plan_prices`                                                                                   |
| Subscriptions    | `subscriptions`, `subscription_items`, `subscription_amendments`, `subscription_events`                                |
| Quotations       | `quotation_templates`, `quotation_template_items`, later `quotations`, `quotation_items`                               |
| Billing          | `invoices`, `invoice_items`, `payments`, later `payment_transactions`, `refunds`, `credit_notes`, `credit_note_items`  |
| Rules/platform   | `discounts`, `discount_rules`, applicability joins, `taxes`, `tax_rules`, `audit_logs`, later `organization_sequences` |

This is a phased target model, not a first-migration checklist.

## Ownership and keys

`users` has globally unique normalized email and no `organization_id`. `organizations.slug` is globally unique and `organizations.timezone` is required. `organization_memberships` has unique `(organization_id, user_id)`. Tenant-owned records such as customers, products, plans, subscriptions, invoices, payments, discounts, taxes, and audit logs carry `organization_id` when it supports access control and lookup. Use unique pairs such as `(organization_id, customer_number)`, `(organization_id, product_code)`, `(organization_id, plan_code)`, `(organization_id, subscription_number)`, and `(organization_id, invoice_number)`.

When a tenant child points to a tenant parent, validate same-tenant ownership in the service and use composite tenant-aware references/uniques where viable. This prevents cross-organization links that ordinary single-column foreign keys cannot detect. The following are mandatory high-risk composite relationships: `subscriptions(organization_id, customer_id)` → `customers(organization_id, id)`; `subscriptions(organization_id, plan_id)` → `plans(organization_id, id)`; `invoices(organization_id, customer_id)` → `customers(organization_id, id)`; optional invoice subscription link → `subscriptions(organization_id, id)`; `payments(organization_id, invoice_id)` → `invoices(organization_id, id)`; `refunds(organization_id, payment_id)` → `payments(organization_id, id)`. Parent tables expose unique `(organization_id, id)` solely to support these foreign keys. A `PlanItem.variant_id`, when present, must belong to its `product_id`.

## Historical records

Products and plans are mutable master data. `PlanPrice` is append-only in effect: create a new effective interval rather than overwrite a used amount. Every effective range is start-inclusive/end-exclusive: `[effective_from, effective_until)`, with `NULL` end meaning open ended. Adjacent prices are legal; overlapping active prices for the same plan/currency/billing period are not. Enforce this through a PostgreSQL range/exclusion constraint when the pricing model is implemented, backed by transactional service validation.

Subscription items snapshot commercially agreed description, product/variant reference where useful, quantity, price, currency, discounts, and applicable tax terms. Invoice items snapshot historical description, quantity, unit price, discount, tax, and line totals. Invoice totals are stored on finalization because they are historical financial facts.

Payments are facts; refunds are separate facts linked to a payment. Credit notes are separate corrections for finalized invoices. Never rewrite a payment amount or finalized invoice lines to simulate a correction. Invoice `amount_paid` and `amount_due`, if persisted, are derived settlement projections updated in the same transaction as a payment/refund/credit-note change and can be recomputed from immutable financial facts.

## Constraints and indexes

Use `NOT NULL`, foreign keys, unique constraints, checks such as `quantity > 0` and nonnegative amounts, composite join keys, and check `effective_until IS NULL OR effective_until > effective_from`. Workflow rules remain in NestJS services rather than enormous SQL checks. Start with indexes for tenant list access (`organization_id`, then proven compound patterns such as `(organization_id, status)`), business-number lookups, joins on `customer_id`, `plan_id`, `subscription_id`, and `invoice_id`, and due-date/status reporting. Review query plans before adding more.

## Numbering and idempotency

Create `organization_sequences` with composite primary key `(organization_id, sequence_type)` and a `next_value BIGINT NOT NULL`. Inside the same transaction that creates a numbered record, increment and return the counter with row locking/`UPDATE ... RETURNING`, format the result as the entity prefix plus padded number, and enforce the corresponding tenant-scoped unique business number. The sequence type is one of `CUSTOMER`, `SUBSCRIPTION`, `INVOICE`, `PAYMENT`, `QUOTATION`, or `REFUND`. Never derive a next number from row count, `MAX`, or a process-local counter.

Create `idempotency_keys` before the payments phase. It contains `id UUID`, `organization_id`, `operation`, `key`, `request_hash`, `status`, `response_reference`, `created_at`, and `expires_at`, with unique `(organization_id, operation, key)`. The command transaction claims the key before creating a payment/refund. Same key plus a different request hash conflicts; the same request returns its stored outcome. Retention duration is defined with the payments implementation.

## Delete and migration policy

Archive/suspend customers, products, plans, organizations, memberships, and roles when used. Restrict deletion of referenced business data. Cascade only tightly owned unused configuration children with no historical significance. Financial records and audit logs are not hard-deleted; audit logs and events are append-only. Finalized invoices are financially immutable; drafts are editable under authorization.

Each migration is reviewed for backwards safety, tenant impact, constraints, indexes, locking risk, backfill, and rollback. Prisma migrations may contain reviewed SQL for PostgreSQL-native constraints. First database milestone contains only organization, global user, organization membership, migration/client infrastructure, and first-Admin bootstrap support.
