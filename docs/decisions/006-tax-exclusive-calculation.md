# ADR 006: Tax-Exclusive Invoice Calculation

## Decision

The first release uses tax-exclusive pricing. For each invoice line: calculate `subtotal`, apply the line discount, calculate percentage tax on the discounted amount, then calculate `line total = subtotal - discount + tax`.

Calculations use PostgreSQL/Prisma decimal values; JavaScript floating-point arithmetic is not authoritative. Line amounts are stored as immutable snapshots when the invoice is finalized.

## First-release scope

Only fixed-amount line discounts and tax amounts are currently supported by the invoice API. Configurable reusable percentage discount and tax rules, tax jurisdictions, and inclusive tax are deferred until their policy and applicability rules are agreed.
