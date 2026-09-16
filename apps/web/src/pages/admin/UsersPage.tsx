import React, { useState } from 'react';
import { Copy, Shield, UserCog, UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/data/FilterBar';
import { DataTable, type ColumnDef } from '@/components/data/DataTable';
import { StatusBadge } from '@/components/data/StatusBadge';
import { DateDisplay } from '@/components/data/DateDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Can } from '@/components/auth/Can';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/lib/api-client';
import { PERMISSIONS } from '@/lib/permissions';
import { useOrganization } from '@/contexts/OrgContext';

interface UserRecord { id: string; name: string; email: string; role: string; status: string; lastLoginAt?: string | null; }
const emptyInvite = { firstName: '', lastName: '', email: '', roleId: '' };

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UserRecord | null>(null);
  const [roleId, setRoleId] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState(emptyInvite);
  const [activationLink, setActivationLink] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { activeOrg } = useOrganization();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['organization-members', activeOrg?.id], queryFn: () => apiClient.getOrganizationMembers(), enabled: Boolean(activeOrg) });
  const rolesQuery = useQuery({ queryKey: ['organization-roles', activeOrg?.id], queryFn: () => apiClient.getOrganizationRoles(), enabled: Boolean(activeOrg) });
  const users: UserRecord[] = (data?.data ?? []).map((membership) => ({ id: membership.id, name: `${membership.user.firstName} ${membership.user.lastName}`, email: membership.user.email, role: membership.roles.map(({ role }) => role.name).join(', ') || 'No role', status: membership.user.status ?? membership.status, lastLoginAt: membership.user.lastLoginAt }));
  const filteredUsers = users.filter((user) => !search || user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase()));
  const roles = [{ value: '', label: 'Choose a role' }, ...(rolesQuery.data?.data ?? []).map((role) => ({ value: role.id, label: role.name }))];
  const columns: ColumnDef<UserRecord>[] = [
    { id: 'name', header: 'Full Name', accessorKey: 'name', sortable: true, cell: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
    { id: 'email', header: 'Work Email', accessorKey: 'email', cell: (row) => <span className="font-mono text-xs text-slate-600">{row.email}</span> },
    { id: 'role', header: 'Assigned Role', accessorKey: 'role', cell: (row) => <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-0.5 text-sm font-medium text-slate-800"><Shield className="h-3 w-3 text-slate-500" />{row.role}</span> },
    { id: 'status', header: 'Status', accessorKey: 'status', cell: (row) => <StatusBadge status={row.status} /> },
    { id: 'lastLoginAt', header: 'Last Active', accessorKey: 'lastLoginAt', cell: (row) => <DateDisplay date={row.lastLoginAt} mode="datetime" /> },
  ];
  async function submitInvite(event: React.FormEvent) {
    event.preventDefault(); if (saving) return; setSaving(true);
    try { const created = await apiClient.createOrganizationInvitation(invite); setActivationLink(`${window.location.origin}/activate?token=${encodeURIComponent(created.activationToken)}`); toast.success('Copy the one-time activation link and share it securely.', 'Invitation created'); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Unable to create invitation.', 'Invitation failed'); }
    finally { setSaving(false); }
  }
  return <div>
    <PageHeader title="Users & Memberships" description="Internal operators, billing managers, and administrators belonging to this organization." actions={<Can permission={PERMISSIONS.USER_CREATE}><Button leftIcon={<UserPlus size={16} />} onClick={() => { setInviteOpen(!inviteOpen); setActivationLink(''); setInvite(emptyInvite); }}>Invite user</Button></Can>} />
    {inviteOpen && <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs"><h2 className="font-semibold text-slate-900">Invite a team member</h2><p className="mt-1 text-sm text-slate-600">Create a seven-day, one-time activation link. Share it securely; no email service is used.</p><form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={submitInvite}><Input label="First name" required value={invite.firstName} onChange={(event) => setInvite({ ...invite, firstName: event.target.value })} /><Input label="Last name" required value={invite.lastName} onChange={(event) => setInvite({ ...invite, lastName: event.target.value })} /><Input label="Work email" type="email" required value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} /><Select label="Role" required value={invite.roleId} options={roles} onChange={(event) => setInvite({ ...invite, roleId: event.target.value })} /><div className="md:col-span-2 flex gap-2"><Button type="submit" isLoading={saving} disabled={!invite.roleId}>Create activation link</Button><Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button></div></form>{activationLink && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3"><Input label="One-time activation link" value={activationLink} readOnly /><Button className="mt-2" size="sm" variant="secondary" leftIcon={<Copy size={14} />} onClick={() => void navigator.clipboard.writeText(activationLink).then(() => toast.success('Activation link copied.', 'Copied')).catch(() => toast.error('Copy the link manually.', 'Clipboard unavailable'))}>Copy link</Button></div>}</section>}
    {selected && <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs"><h2 className="font-semibold text-slate-900">Assign role to {selected.name}</h2><p className="mt-1 text-sm text-slate-600">This immediately updates the member’s organization permissions on their next access check.</p><div className="mt-4 flex max-w-md flex-col gap-3 sm:flex-row"><Select label="Role" value={roleId} onChange={(event) => setRoleId(event.target.value)} options={roles} /><div className="flex items-end gap-2"><Button disabled={!roleId} isLoading={saving} onClick={async () => { setSaving(true); try { await apiClient.assignMemberRoles(selected.id, [roleId]); await Promise.all([refetch(), rolesQuery.refetch()]); toast.success(`Role updated for ${selected.name}.`, 'Saved'); setSelected(null); } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Unable to assign role.', 'Role failed'); } finally { setSaving(false); } }}>Save role</Button><Button variant="secondary" disabled={saving} onClick={() => setSelected(null)}>Cancel</Button></div></div></section>}
    <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Filter users by name or email..." isFiltered={Boolean(search)} onReset={() => setSearch('')} />
    <DataTable columns={columns} data={filteredUsers} keyExtractor={(user) => user.id} isLoading={isLoading} isError={isError} errorMessage={error instanceof Error ? error.message : undefined} actions={(row) => [{ id: 'assign-role', label: 'Assign role', icon: <UserCog className="h-3.5 w-3.5" />, onClick: () => { setSelected(row); setRoleId(''); } }]} emptyTitle="No users found" emptyDescription="Invite team members to collaborate within this organization." />
  </div>;
}
