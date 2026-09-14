# ADR 007: Plans and Effective Pricing

**Status:** Accepted  
**Date:** 2026-09-14

Plans are tenant-owned, archive-only catalog bundles. A plan price applies to the whole plan, not individual items. Prices use `[effective_from, effective_until)` date intervals; active intervals cannot overlap for a plan, currency, and billing period. Prices are append-only: replace a price by closing it and creating a successor. Plan items must reference active products and, when supplied, an active variant of that product in the active organization.
