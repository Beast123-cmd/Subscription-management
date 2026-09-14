# ADR 005: Customer Records and Numbering

**Status:** Accepted  
**Date:** 2026-09-14

## Context

Customers are tenant-owned buyers, distinct from platform users. The first customer release needs reliable business-facing numbers, address/contact maintenance, archive semantics, and strict tenant isolation without introducing subscription or portal complexity.

## Decision

- Customers are either `BUSINESS` or `INDIVIDUAL`, have tenant-scoped `CUS-######` numbers, and use `ACTIVE` or `ARCHIVED` status. They are never hard-deleted.
- Customer contacts and addresses are directly owned by a customer and use restrictive foreign keys. Partial unique PostgreSQL indexes permit one primary contact per customer and one default address per customer/address type.
- Customer numbers use `organization_sequences` and an atomic `INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING` in the same transaction as customer creation. Numbers are never derived from row counts or maximum values.
- All customer routes require an authenticated active organization and the relevant `customer.read`, `customer.create`, or `customer.update` permission. Record lookups always include the active organization.
- Customer lists use a stable descending creation-time/ID order, a 25-record page size, and opaque cursors.

## Consequences

- A concurrent customer creation cannot reuse a number within an organization.
- Archiving preserves customer history and deliberately does not cascade into contacts or addresses.
- No portal-user link, customer merge, import/export, audit trail, or billing relationship is added in this phase; those require their own operational policies.
