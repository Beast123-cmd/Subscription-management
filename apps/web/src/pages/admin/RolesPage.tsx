import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type ColumnDef } from '@/components/data/DataTable';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useOrganization } from '@/contexts/OrgContext';

interface RoleRow {
  id: string;
  name: string;
  code: string;
  isSystem: boolean;
  description: string;
  permissionsCount: number;
}

export function RolesPage() {
  const { activeOrg } = useOrganization();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['organization-roles', activeOrg?.id],
    queryFn: () => apiClient.getOrganizationRoles(),
    enabled: Boolean(activeOrg),
  });
  const roles: RoleRow[] = (data?.data ?? []).map((role) => ({
    id: role.id,
    name: role.name,
    code: role.code,
    isSystem: role.isSystem,
    description: role.description ?? '',
    permissionsCount: role.permissionsCount ?? 0,
  }));

  const columns: ColumnDef<RoleRow>[] = [
    {
      id: 'name',
      header: 'Role Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-slate-500" />
          <span className="font-semibold text-slate-900">{row.name}</span>
        </div>
      ),
    },
    {
      id: 'code',
      header: 'Code',
      accessorKey: 'code',
      cell: (row) => <span className="font-mono text-[11px] text-slate-600">{row.code}</span>,
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      cell: (row) => <span className="text-xs text-slate-500 max-w-md block">{row.description}</span>,
    },
    {
      id: 'isSystem',
      header: 'Type',
      accessorKey: 'isSystem',
      cell: (row) => (
        <Badge variant={row.isSystem ? 'neutral' : 'outline'}>
          {row.isSystem ? 'System Defined' : 'Custom'}
        </Badge>
      ),
    },
    {
      id: 'permissionsCount',
      header: 'Grants',
      accessorKey: 'permissionsCount',
      cell: (row) => (
        <span className="text-xs font-semibold text-slate-700">{row.permissionsCount} permissions</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        description="Tenant-scoped authorization policies and fine-grained permission codes."
      />

      <DataTable
        columns={columns}
        data={roles}
        keyExtractor={(r) => r.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
        emptyTitle="No roles found"
      />
    </div>
  );
}
