import React, { createContext, useContext } from 'react';
import { useOrganization } from './OrgContext';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  type PermissionCode,
} from '@/lib/permissions';

interface PermissionContextValue {
  permissions: string[];
  roleName: string;
  isLoading: boolean;
  can: (permission: PermissionCode) => boolean;
  canAll: (permissions: PermissionCode[]) => boolean;
  canAny: (permissions: PermissionCode[]) => boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { activeOrg, isSwitchingOrg } = useOrganization();
  const query = useQuery({ queryKey: ['access', activeOrg?.id], queryFn: () => apiClient.getAccess(), enabled: Boolean(activeOrg) && !isSwitchingOrg });
  const permissions = query.data?.permissions ?? [];

  const can = (permission: PermissionCode) => hasPermission(permissions, permission);
  const canAll = (perms: PermissionCode[]) => hasAllPermissions(permissions, perms);
  const canAny = (perms: PermissionCode[]) => hasAnyPermission(permissions, perms);

  return (
    <PermissionContext.Provider value={{ permissions, roleName: query.data?.roles.join(', ') || 'Member', isLoading: query.isPending || isSwitchingOrg, can, canAll, canAny }}>
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
