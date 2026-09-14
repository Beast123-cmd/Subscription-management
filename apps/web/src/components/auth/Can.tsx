import React from 'react';
import { usePermission } from '@/contexts/PermissionContext';
import type { PermissionCode } from '@/lib/permissions';

export interface CanProps {
  permission?: PermissionCode;
  all?: PermissionCode[];
  any?: PermissionCode[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Declarative component for RBAC-aware UI rendering.
 * Remember: Frontend permission checks are UX controls, not security controls.
 */
export function Can({ permission, all, any, fallback = null, children }: CanProps) {
  const { can, canAll, canAny } = usePermission();

  let hasAccess = true;

  if (permission && !can(permission)) {
    hasAccess = false;
  }

  if (all && !canAll(all)) {
    hasAccess = false;
  }

  if (any && !canAny(any)) {
    hasAccess = false;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
