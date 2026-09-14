import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  type PermissionCode,
} from '@/lib/permissions';

interface PermissionContextValue {
  permissions: string[];
  can: (permission: PermissionCode) => boolean;
  canAll: (permissions: PermissionCode[]) => boolean;
  canAny: (permissions: PermissionCode[]) => boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { permissions } = useAuth();

  const can = (permission: PermissionCode) => hasPermission(permissions, permission);
  const canAll = (perms: PermissionCode[]) => hasAllPermissions(permissions, perms);
  const canAny = (perms: PermissionCode[]) => hasAnyPermission(permissions, perms);

  return (
    <PermissionContext.Provider value={{ permissions, can, canAll, canAny }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission(): PermissionContextValue {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
}
