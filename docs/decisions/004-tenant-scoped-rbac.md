# ADR 004: Tenant-Scoped RBAC

**Status:** Accepted  
**Date:** 2026-09-14

## Context

Authenticated users may belong to multiple organizations. Authorization must remain correct when a user changes organizations, a membership is revoked, or role grants change. Roles must not leak across tenant boundaries.

## Decision

- `permissions` is a global, code-based catalog. A code has the form `resource.action`.
- `roles` belong to exactly one organization; `role_permissions` grants catalog permissions to a role.
- `membership_roles` assigns tenant-local roles to a membership, not directly to a user.
- The assignment table carries `organization_id` and uses composite foreign keys to ensure its membership and role belong to the same organization at the database layer.
- A short-lived JWT identifies the user and selected organization. It never carries role or permission grants.
- Tenant-scoped routes use JWT authentication, active-membership validation, then a permission guard that queries the current grants in PostgreSQL.
- The seed command creates an `ADMIN` system role in every organization and grants all permissions currently defined by the application. For an organization with exactly one membership, it assigns that membership the role; it never guesses an administrator for organizations with multiple members.

## Consequences

- Revoking a membership or changing grants takes effect on the next protected request, without waiting for a token to expire.
- Each new domain capability must add its explicit permission code and attach it to its routes with `@RequirePermissions(...)`.
- Role-management endpoints and custom role administration are deferred until the organization administration module is built.
- After an RBAC migration, operators run `pnpm --filter @subscription-management/api seed:rbac` once per environment. The command is idempotent.
