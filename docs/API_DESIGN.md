# API Design

## Conventions

Endpoints are under `/api` initially. JSON request/response fields use camelCase; database names remain snake_case. UUIDs identify resources. APIs never expose password hashes or internal secrets. Authenticated requests carry a JWT and active-organization selector; the server verifies membership before execution.

Use `200/201/204` success, `400` validation/command error, `401` unauthenticated, `403` forbidden, `404` not found in the active tenant, `409` uniqueness/state/concurrency conflict, `422` domain-rule violation, and `500` safe internal error. Error envelope:

```json
{
  "error": {
    "code": "INVOICE_NOT_DRAFT",
    "message": "Only draft invoices can be finalized.",
    "details": []
  }
}
```

List responses use `limit`, opaque `cursor`, allow-listed filters/sort, and stable ordering:

```json
{ "data": [], "page": { "nextCursor": null, "limit": 25 } }
```

## Authentication and organization context

| Method/path                          | Purpose                                                   |
| ------------------------------------ | --------------------------------------------------------- |
| `POST /api/auth/login`               | Authenticate email/password and issue JWT/session payload |
| `POST /api/auth/logout`              | End local/session state as applicable                     |
| `GET /api/auth/me`                   | Current active user and available organizations           |
| `GET /api/organizations`             | Organizations available to the user                       |
| `POST /api/organizations/:id/select` | Select an authorized active organization                  |

Active organization is encoded in a newly issued one-hour JWT after selection. Tenant guards verify that token claim against the current active membership and organization in PostgreSQL on every tenant-scoped request; the claim alone never grants access.

Permission grants are also read from PostgreSQL on every protected request. Routes declare required codes such as `customer.read` or `customer.create`; roles are tenant-local and are assigned to memberships. Role and permission claims are intentionally absent from the JWT, so membership revocations and grant changes apply immediately.

## Resource endpoints

Standard CRUD applies only to editable resources. Each route requires domain permission and scopes data to the active organization.

| Resource      | Initial routes                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Customers     | `GET/POST /customers`, `GET/PATCH /customers/:id`, archive and contact/address CRUD               |
| Products      | `GET/POST /products`, `GET/PATCH /products/:id`, archive, variant, and attribute/value operations |
| Plans         | `GET/POST /plans`, `GET/PATCH /plans/:id`, `POST /plans/:id/prices`                               |
| Subscriptions | `GET/POST /subscriptions`, `GET /subscriptions/:id`                                               |
| Quotations    | `GET/POST /quotations`, `GET /quotations/:id`                                                     |
| Invoices      | `GET/POST /invoices`, `GET /invoices/:id`                                                         |
| Payments      | `GET /payments`, `POST /payments`                                                                 |
| Reports       | `GET /reports/revenue`, `/reports/subscriptions`, `/reports/payments`                             |

## Command endpoints

| Endpoint                           | Required outcome                                      |
| ---------------------------------- | ----------------------------------------------------- |
| `POST /subscriptions/:id/confirm`  | Validate transition; create business event/audit      |
| `POST /subscriptions/:id/activate` | Validate effective terms and activate atomically      |
| `POST /subscriptions/:id/pause`    | Record amendment/event and pause                      |
| `POST /subscriptions/:id/resume`   | Record amendment/event and resume                     |
| `POST /subscriptions/:id/cancel`   | Validate cancellation and preserve history            |
| `POST /invoices/:id/finalize`      | Calculate/snapshot totals and lock financial document |
| `POST /invoices/:id/void`          | Void according to policy with audit trail             |
| `POST /payments`                   | Record one invoice payment atomically                 |
| `POST /payments/:id/refunds`       | Create refund without changing payment history        |

`POST /payments` and `POST /payments/:id/refunds` require an `Idempotency-Key` header from their first release. The server stores a tenant-scoped command fingerprint/result and returns the original result for an equivalent retry; a reused key with different request content returns `409`. Other commands adopt idempotency whenever they can be retried or cause a financial/lifecycle side effect. Zod validates boundary input; services make final authorization and domain checks.

## Contract discipline

Add an OpenAPI document/generated schema when endpoint work begins. Define DTOs per endpoint; never expose Prisma models directly. Add fields compatibly, deprecate before removal, and document breaking contract changes.
