# Engineering Documentation

This directory is the implementation contract for the Subscription Management / Revenue Operations Platform.

| Document | Use it for |
| --- | --- |
| [PRD](PRD.md) | Product goals, users, scope, workflows, and acceptance outcomes |
| [Architecture](ARCHITECTURE.md) | System boundaries, stack, tenancy, security, and operational principles |
| [Low-Level Design](LOW_LEVEL_DESIGN.md) | Modules, request flow, state machines, transactions, and code conventions |
| [Database Design](DATABASE_DESIGN.md) | Relational model, integrity rules, history, indexing, and migrations |
| [Database Specification](DATABASE_SPECIFICATION.md) | Exact target table contracts, keys, types, and implementation constraints |
| [API Design](API_DESIGN.md) | REST contracts, authentication, errors, pagination, and commands |
| [Build Plan](BUILD_PLAN.md) | Ordered delivery milestones, dependencies, and verification |
| [Architecture Review](../PROJECT_ARCHITECTURE_AND_DATABASE_REVIEW.md) | Original design-gate review and ERD |
| [ADR 001](decisions/001-finalized-design-amendments.md) | Approved lifecycle, tenancy, financial, timezone, and concurrency amendments |

## Governance

The project is a modular monolith. PostgreSQL is the operational source of truth; NestJS owns business rules; the web client owns presentation and user experience. Changes to tenant isolation, financial calculation, historical records, RBAC, or lifecycle states require a concise ADR in `docs/decisions/` before implementation.

When documents disagree, use this order: approved ADRs, Database Design for data integrity, Architecture for system boundaries, Low-Level Design/API Design for implementation contracts, then the PRD and Build Plan. The master project prompt is the original source context.
