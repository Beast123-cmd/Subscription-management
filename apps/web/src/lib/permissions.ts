export const PERMISSIONS = {
  // Organization
  ORGANIZATION_READ: 'organization.read',
  ORGANIZATION_UPDATE: 'organization.update',

  // Users & Roles
  USER_READ: 'user.read',
  USER_CREATE: 'user.create',
  ROLE_READ: 'role.read',
  ROLE_MANAGE: 'role.manage',

  // Customers
  CUSTOMER_READ: 'customer.read',
  CUSTOMER_CREATE: 'customer.create',
  CUSTOMER_UPDATE: 'customer.update',

  // Catalog & Plans
  PRODUCT_READ: 'product.read',
  PRODUCT_CREATE: 'product.create',
  PRODUCT_UPDATE: 'product.update',
  PLAN_READ: 'plan.read',
  PLAN_CREATE: 'plan.create',
  PLAN_UPDATE: 'plan.update',

  // Subscriptions & Quotations
  SUBSCRIPTION_READ: 'subscription.read',
  SUBSCRIPTION_CREATE: 'subscription.create',
  SUBSCRIPTION_UPDATE: 'subscription.update',
  QUOTATION_READ: 'quotation.read',
  QUOTATION_CREATE: 'quotation.create',
  QUOTATION_UPDATE: 'quotation.update',

  // Invoices & Payments
  INVOICE_READ: 'invoice.read',
  INVOICE_CREATE: 'invoice.create',
  INVOICE_FINALIZE: 'invoice.finalize',
  INVOICE_VOID: 'invoice.void',
  PAYMENT_READ: 'payment.read',
  PAYMENT_CREATE: 'payment.create',
  PAYMENT_REFUND: 'payment.refund',

  // Insights & Audit
  REPORT_READ: 'report.read',
  AUDIT_READ: 'audit.read',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS] | string;

export function hasPermission(grantedPermissions: string[], requiredPermission: PermissionCode): boolean {
  if (!grantedPermissions) return false;
  // Super admin wildcard or explicit match
  return grantedPermissions.includes('*') || grantedPermissions.includes(requiredPermission);
}

export function hasAllPermissions(grantedPermissions: string[], requiredPermissions: PermissionCode[]): boolean {
  if (!requiredPermissions.length) return true;
  return requiredPermissions.every((p) => hasPermission(grantedPermissions, p));
}

export function hasAnyPermission(grantedPermissions: string[], requiredPermissions: PermissionCode[]): boolean {
  if (!requiredPermissions.length) return true;
  return requiredPermissions.some((p) => hasPermission(grantedPermissions, p));
}
