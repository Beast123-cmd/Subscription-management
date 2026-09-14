# ADR 008: Subscription Lifecycle and Snapshots

**Status:** Accepted  
**Date:** 2026-09-14

Subscriptions are tenant-owned contracts created in `DRAFT`, then moved only by commands: `CONFIRMED`, `ACTIVE`, `PAUSED`, `CANCELLED`, `EXPIRED`, or `CLOSED`. A subscription has no quotation state; quotations remain a separate aggregate. Creation validates active tenant customer/plan, resolves an effective active plan price, and snapshots item descriptions, quantity, unit price, currency, and basic terms. Every successful transition writes an append-only subscription event and commercial transitions write an amendment snapshot. Subscription number allocation is transaction-safe and tenant scoped.
