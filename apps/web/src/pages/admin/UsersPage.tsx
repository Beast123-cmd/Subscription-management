import React, { useState } from 'react';
import { Plus, UserPlus, Shield } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/data/FilterBar';
import { DataTable, type ColumnDef } from '@/components/data/DataTable';
import { StatusBadge } from '@/components/data/StatusBadge';
import { DateDisplay } from '@/components/data/DateDisplay';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/auth/Can';
import { PERMISSIONS } from '@/lib/permissions';
import { MOCK_USERS } from '@/lib/mock-data';
import { useToast } from '@/contexts/ToastContext';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt?: string | null;
}

export function UsersPage() {
  const [search, setSearch] = useState('');
  const toast = useToast();

  const users: UserRecord[] = MOCK_USERS.map((u) => ({
    id: u.user.id,
    name: `${u.user.firstName} ${u.user.lastName}`,
    email: u.user.email,
    role: u.role,
    status: u.user.status || 'ACTIVE',
    lastLoginAt: u.user.lastLoginAt,
  }));

  const filteredUsers = users.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnDef<UserRecord>[] = [
    {
      id: 'name',
      header: 'Full Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => <span className="font-semibold text-slate-900">{row.name}</span>,
    },
    {
      id: 'email',
      header: 'Work Email',
      accessorKey: 'email',
      cell: (row) => <span className="text-xs text-slate-600 font-mono">{row.email}</span>,
    },
    {
      id: 'role',
      header: 'Assigned Role',
      accessorKey: 'role',
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-800">
          <Shield className="h-3 w-3 text-slate-500" />
          {row.role}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'lastLoginAt',
      header: 'Last Active',
      accessorKey: 'lastLoginAt',
      cell: (row) => <DateDisplay date={row.lastLoginAt} mode="datetime" />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users & Memberships"
        description="Internal operators, billing managers, and administrators belonging to this organization."
        actions={
          <Can permission={PERMISSIONS.USER_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => toast.info('User invitation will be wired in Phase 3/5.', 'Invite User')}
              leftIcon={<UserPlus className="h-3.5 w-3.5" />}
            >
              Invite User
            </Button>
          </Can>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter users by name or email..."
        isFiltered={Boolean(search)}
        onReset={() => setSearch('')}
      />

      <DataTable
        columns={columns}
        data={filteredUsers}
        keyExtractor={(u) => u.id}
        emptyTitle="No users found"
        emptyDescription="Invite team members to collaborate within this organization."
      />
    </div>
  );
}
