# ADR 009: Invoice Finalization and Immutability

Draft invoices contain editable snapshotted lines. Finalization is an explicit atomic command that calculates and stores totals, assigns a tenant-scoped number, and makes the invoice immutable. A finalized invoice may only be voided; corrections use later credit-note workflows. Tax, discount, and payment allocation calculation are deferred to their respective phases.
