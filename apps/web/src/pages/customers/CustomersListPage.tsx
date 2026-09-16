import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, Edit, Archive } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/data/FilterBar';
import { DataTable, type ColumnDef } from '@/components/data/DataTable';
import { StatusBadge } from '@/components/data/StatusBadge';
import { DateDisplay } from '@/components/data/DateDisplay';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/auth/Can';
import { PERMISSIONS } from '@/lib/permissions';
import { apiClient } from '@/lib/api-client';
import { useOrganization } from '@/contexts/OrgContext';
import { useToast } from '@/contexts/ToastContext';
import type { Customer } from '@/types';
import { Input } from '@/components/ui/input';
import { useCommand } from '@/lib/use-command';

export function CustomersListPage() {
  const { activeOrg } = useOrganization();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [legalName, setLegalName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { run } = useCommand();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customers', activeOrg?.id, search, statusFilter],
    queryFn: () => apiClient.getCustomers({ search, status: statusFilter }),
  });

  const rawCustomers = data?.data || [];
  const filteredCustomers = rawCustomers.filter((c) => {
    const matchesSearch =
      !search ||
      c.displayName.toLowerCase().includes(search.toLowerCase()) ||
      c.customerNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.legalName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnDef<Customer>[] = [
    {
      id: 'customerNumber',
      header: 'Customer ID',
      accessorKey: 'customerNumber',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-slate-900 tabular-nums">
          {row.customerNumber}
        </span>
      ),
    },
    {
      id: 'displayName',
      header: 'Customer Name',
      accessorKey: 'displayName',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-medium text-slate-900 block">{row.displayName}</span>
          <span className="text-sm text-slate-400 block">{row.legalName}</span>
        </div>
      ),
    },
    {
      id: 'customerType',
      header: 'Type',
      accessorKey: 'customerType',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-slate-600 font-medium">
          {row.customerType === 'BUSINESS' ? 'Business Account' : 'Individual'}
        </span>
      ),
    },
    {
      id: 'email',
      header: 'Email Contact',
      accessorKey: 'email',
      cell: (row) => <span className="text-xs text-slate-600">{row.email || '—'}</span>,
    },
    {
      id: 'defaultCurrencyCode',
      header: 'Currency',
      accessorKey: 'defaultCurrencyCode',
      cell: (row) => (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">
          {row.defaultCurrencyCode}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'createdAt',
      header: 'Enrolled',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => <DateDisplay date={row.createdAt} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Master commercial accounts, contacts, typed addresses and billing terms."
        actions={
          <Can permission={PERMISSIONS.CUSTOMER_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setFormOpen(true)}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Add Customer
            </Button>
          </Can>
        }
      />

      {formOpen && <form className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={async (e) => { e.preventDefault(); setSaving(true); try { await apiClient.createCustomer({ customerType: 'BUSINESS', legalName, displayName: legalName, email: email || undefined, defaultCurrencyCode: activeOrg?.defaultCurrencyCode ?? 'INR' }); toast.success('Customer created.', 'Success'); setFormOpen(false); setLegalName(''); setEmail(''); await refetch(); } catch (err) { toast.error(err instanceof Error ? err.message : 'Unable to create customer.', 'Customer failed'); } finally { setSaving(false); } }}><div className="mb-4 text-sm font-semibold text-slate-900">Add customer</div><div className="grid gap-3 md:grid-cols-2"><Input required placeholder="Legal / display name" value={legalName} onChange={(e) => setLegalName(e.target.value)} /><Input type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} /></div><div className="mt-4 flex gap-2"><Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create customer'}</Button><Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button></div></form>}

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter by customer name or CUS- number..."
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={[
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Archived', value: 'ARCHIVED' },
        ]}
        isFiltered={Boolean(search || statusFilter !== 'ALL')}
        onReset={() => {
          setSearch('');
          setStatusFilter('ALL');
        }}
      />

      <DataTable
        columns={columns}
        data={filteredCustomers}
        keyExtractor={(c) => c.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
        onRowClick={(c) => navigate(`/app/customers/${c.id}`)}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        actions={(row) => [
          {
            id: 'view',
            label: 'View details',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/app/customers/${row.id}`),
          },
          {
            id: 'edit',
            label: 'Edit details',
            icon: <Edit className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/app/customers/${row.id}`),
          },
          {
            id: 'archive',
            label: 'Archive customer',
            icon: <Archive className="h-3.5 w-3.5" />,
            destructive: true,
            onClick: () => void run(`/customers/${row.id}/archive`, `${row.customerNumber} archived.`, `Archive ${row.displayName}? Existing financial records stay unchanged.`),
          },
        ]}
        emptyTitle="No customers found"
        emptyDescription="Get started by creating your first commercial customer account."
        emptyAction={
          <Can permission={PERMISSIONS.CUSTOMER_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setFormOpen(true)}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Create Customer
            </Button>
          </Can>
        }
      />
    </div>
  );
}
