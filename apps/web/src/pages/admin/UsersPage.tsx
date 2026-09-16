import React, { useState } from 'react';
import { Shield, UserCog } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/data/FilterBar';
import { DataTable, type ColumnDef } from '@/components/data/DataTable';
import { StatusBadge } from '@/components/data/StatusBadge';
import { DateDisplay } from '@/components/data/DateDisplay';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useOrganization } from '@/contexts/OrgContext';
import { Select } from '@/components/ui/select';

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
  const [selected, setSelected] = useState<UserRecord | null>(null);
  const [roleId, setRoleId] = useState('');
  const [saving, setSaving] = useState(false);
  const { activeOrg } = useOrganization();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['organization-members', activeOrg?.id],
    queryFn: () => apiClient.getOrganizationMembers(),
    enabled: Boolean(activeOrg),
  });
  const rolesQuery = useQuery({ queryKey: ['organization-roles', activeOrg?.id], queryFn: () => apiClient.getOrganizationRoles(), enabled: Boolean(activeOrg) });

  const users: UserRecord[] = (data?.data ?? []).map((membership) => ({
    id: membership.id,
    name: `${membership.user.firstName} ${membership.user.lastName}`,
    email: membership.user.email,
    role: membership.roles.map(({ role }) => role.name).join(', ') || 'No role',
    status: membership.user.status ?? membership.status,
    lastLoginAt: membership.user.lastLoginAt,
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
        <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-0.5 text-sm font-medium text-slate-800">
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
          <p className="text-sm text-slate-500">Invitation delivery will be enabled with the account-activation service.</p>
        }
      />
      {selected && <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs"><h2 className="font-semibold text-slate-900">Assign role to {selected.name}</h2><p className="mt-1 text-sm text-slate-600">This immediately updates the member’s organization permissions on their next access check.</p><div className="mt-4 flex max-w-md flex-col gap-3 sm:flex-row"><Select label="Role" value={roleId} onChange={(event) => setRoleId(event.target.value)} options={[{ value: '', label: 'Choose a role' }, ...(rolesQuery.data?.data ?? []).map((role) => ({ value: role.id, label: role.name }))]} /><div className="flex items-end gap-2"><Button disabled={!roleId} isLoading={saving} onClick={async () => { setSaving(true); try { await apiClient.assignMemberRoles(selected.id, [roleId]); await Promise.all([refetch(), rolesQuery.refetch()]); toast.success(`Role updated for ${selected.name}.`, 'Saved'); setSelected(null); } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to assign role.', 'Role failed'); } finally { setSaving(false); } }}>Save role</Button><Button variant="secondary" disabled={saving} onClick={() => setSelected(null)}>Cancel</Button></div></div></section>}

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
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
        actions={(row) => [{ id: 'assign-role', label: 'Assign role', icon: <UserCog className="h-3.5 w-3.5" />, onClick: () => { setSelected(row); setRoleId(''); } }]}
        emptyTitle="No users found"
        emptyDescription="Invite team members to collaborate within this organization."
      />
    </div>
  );
}
