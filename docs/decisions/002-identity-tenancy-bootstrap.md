# ADR 002: Identity, Tenancy, and First-Admin Bootstrap

## Context

Phase 3 introduces global user identities and organization memberships before authentication and RBAC. The team must avoid putting tenant ownership on users while retaining a controlled path for creating the first privileged user.

## Decisions

1. `User.email` stores a trimmed, lowercase email address. The API normalizes it before persistence; the database enforces global uniqueness with `VARCHAR(320)` rather than requiring a PostgreSQL extension.
2. `Organization.slug` is globally unique, lowercase, URL-safe, and immutable after organization creation unless an explicit future rename command is approved.
3. `Organization.timezone` stores a validated IANA zone, defaults to `Asia/Kolkata`, and is immutable through generic updates. Future changes require an explicit organization-settings command because billing/reporting semantics depend on it.
4. User status defaults to `INVITED`; an invited identity cannot authenticate until the Phase 4/5 activation flow is complete.
5. Membership status defaults to `ACTIVE`; revocation/suspension retains membership history.
6. The first organization membership is created through a controlled bootstrap service/CLI. It is allowed only when the organization has no existing memberships and is disabled after use. Phase 5 assigns the initial Admin role inside the same transaction once RBAC tables exist.

## Consequences

Phase 3 creates no role, permission, password-login, or tenant-selection API. It creates durable identity/tenant records and the migration foundation those phases require. Email, slug, and timezone validation must be implemented at their first external API boundary in Phase 4.
