import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type ColumnDef } from '@/components/data/DataTable';
import { Badge } from '@/components/ui/badge';
import { MOCK_USERS } from '@/lib/mock-data';

interface RoleRow {
  id: string;
  name: string;
  code: string;
  isSystem: boolean;
  description: string;
  permissionsCount: number;
}

export function RolesPage() {
  const roles: RoleRow[] = [
    {
      id: 'role-1',
      name: 'Organization Admin',
      code: 'ADMIN',
      isSystem: true,
      description: 'Unrestricted administrative access to all platform domains and tenant configuration.',
      permissionsCount: 20,
    },
    {
      id: 'role-2',
      name: 'Billing Manager',
      code: 'BILLING_MANAGER',
      isSystem: true,
      description: 'Management of invoicing, payments, refunds, collections, and billing reports.',
      permissionsCount: 14,
    },
    {
      id: 'role-3',
      name: 'Read-only User',
      code: 'VIEWER',
      isSystem: true,
      description: 'Audit and inspection access across commercial records without mutation capabilities.',
      permissionsCount: 8,
    },
  ];

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
        emptyTitle="No roles found"
      />
    </div>
  );
}
