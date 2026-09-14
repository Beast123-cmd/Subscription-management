# ADR 006: Catalog Ownership and Variants

**Status:** Accepted  
**Date:** 2026-09-14

## Context

The catalog is tenant-owned master data needed before plans and subscriptions. Products must support physical goods and services, optional variants, and controlled attribute values without allowing cross-tenant or cross-product variant assignments.

## Decision

- A product belongs to one organization and has a unique organization-scoped product code. It is `GOODS` or `SERVICE` and uses `ACTIVE`/`ARCHIVED` status; catalog records are not hard-deleted.
- Variants and product attributes carry both `organization_id` and `product_id`, backed by composite foreign keys to the tenant-owned product. SKU is unique within an organization.
- Attribute values belong to an attribute. Replacing a variant's assigned values is an atomic operation that accepts only values defined on attributes of that same product.
- Product cost is stored as `NUMERIC(19,4)` with an explicit ISO currency code. It is catalog metadata, not a customer price or financial snapshot.
- Routes require the active organization plus `product.read`, `product.create`, or `product.update` permissions. Product lists use the same stable, opaque-cursor pagination as customers.

## Consequences

- Later plan items can safely refer to a product/variant after adding their own tenant-aware relationship checks.
- Price lists, stock/inventory, bundled products, media, suppliers, and variant-combination generation are deferred until their workflows are defined.
