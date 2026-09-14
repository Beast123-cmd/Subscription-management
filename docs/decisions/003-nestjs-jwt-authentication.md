# ADR 003: NestJS JWT Authentication

## Context

Neon Auth is provisioned on the Neon project, but the approved application architecture specifies first-party email/password authentication, JWTs, and organization-scoped RBAC. The team must choose an identity/session owner before API routes depend on it.

## Decision

The application uses NestJS with bcrypt password hashes and one-hour JWT access tokens. `User` remains the global platform identity. Login returns a JWT with only the user subject; selecting an active organization verifies an active membership and returns a replacement JWT with `activeOrganizationId`. Both tokens expire one hour after issuance; selection starts a new one-hour lifetime.

Every tenant-scoped route uses the JWT guard plus `TenantGuard`. The guard checks the current active membership and organization status in PostgreSQL; JWT claims are not sufficient authorization. Neon Auth remains provisioned but unused by application code.

## Consequences

Phase 4 adds login, current-user, organization-list, organization-selection, tenant guard, and a one-time bootstrap CLI. RBAC is still deferred to Phase 5, so the bootstrap creates an active user/membership but cannot assign an Admin role yet. Password reset, refresh tokens, email verification, OAuth, and SSO remain out of scope.
