# Release QA checklist

Run these checks against an isolated organization before release.

## Core commercial flow

- Create an active customer, contact, and billing address.
- Create an active product, add it to a plan, and add an effective plan price.
- Create a subscription, then confirm and activate it.
- Create and issue a quotation; accept it and create one draft subscription from it.
- Create an invoice draft, add tax/discounted lines, finalize it, and record a partial payment.
- Record a refund within the source payment's remaining refundable balance.

## Authorization and resilience

- Confirm a read-only member cannot see or call create/update actions.
- Change a member role and verify the new role applies after the next access check.
- Switch organizations and verify lists/forms use only the selected organization's data.
- Test validation and network failures: input remains visible and no success toast appears.
- Confirm repeated payment/refund submissions do not create a duplicate record.

## Responsive and visual checks

- Review login and core list/detail screens at 360px, 768px, 1280px, and 1440px.
- Review at 200% browser zoom and with keyboard-only navigation.
- Verify empty, loading, error, and restricted-permission states.
- Confirm all displayed actions either persist or explicitly state that the capability is unavailable.
