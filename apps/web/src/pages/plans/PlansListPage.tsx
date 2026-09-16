import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/data/FilterBar';
import { DataTable, type ColumnDef } from '@/components/data/DataTable';
import { StatusBadge } from '@/components/data/StatusBadge';
import { CurrencyDisplay } from '@/components/data/CurrencyDisplay';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/auth/Can';
import { PERMISSIONS } from '@/lib/permissions';
import { apiClient } from '@/lib/api-client';
import { useOrganization } from '@/contexts/OrgContext';
import { useToast } from '@/contexts/ToastContext';
import type { Plan } from '@/types';
import { Input } from '@/components/ui/input';

export function PlansListPage() {
  const { activeOrg } = useOrganization();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formOpen, setFormOpen] = useState(false); const [code, setCode] = useState(''); const [name, setName] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['plans', activeOrg?.id, search, statusFilter],
    queryFn: () => apiClient.getPlans(),
  });

  const rawPlans = data?.data || [];
  const filteredPlans = rawPlans.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.planCode.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnDef<Plan>[] = [
    {
      id: 'planCode',
      header: 'Plan Code',
      accessorKey: 'planCode',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-slate-900 tabular-nums">
          {row.planCode}
        </span>
      ),
    },
    {
      id: 'name',
      header: 'Plan Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-medium text-slate-900 block">{row.name}</span>
          <span className="text-sm text-slate-400 block truncate max-w-sm">{row.description}</span>
        </div>
      ),
    },
    {
      id: 'pricing',
      header: 'Active Rate',
      align: 'right',
      cell: (row) => {
        const p = row.prices?.[0];
        if (!p) return <span className="text-slate-400 text-xs">Unpriced</span>;
        return (
          <div className="text-right">
            <CurrencyDisplay amount={p.amount} currencyCode={p.currencyCode} align="right" />
            <span className="text-xs text-slate-400 block">/ {p.billingPeriod.toLowerCase()}</span>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Plans & Pricing"
        description="Subscription offerings with effective-dated prices by currency and billing period."
        actions={
          <Can permission={PERMISSIONS.PLAN_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setFormOpen(true)}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Create Plan
            </Button>
          </Can>
        }
      />

      {formOpen && <form className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={async (e) => { e.preventDefault(); try { await apiClient.createPlan({ planCode: code, name }); toast.success('Plan created.', 'Success'); setFormOpen(false); await refetch(); } catch (err) { toast.error(err instanceof Error ? err.message : 'Unable to create plan.', 'Plan failed'); } }}><div className="mb-4 text-sm font-semibold">Create plan</div><div className="grid gap-3 md:grid-cols-2"><Input required placeholder="Plan code" value={code} onChange={(e) => setCode(e.target.value)} /><Input required placeholder="Plan name" value={name} onChange={(e) => setName(e.target.value)} /></div><div className="mt-4 flex gap-2"><Button type="submit">Create plan</Button><Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button></div></form>}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter plans by name or code..."
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
        data={filteredPlans}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
        onRowClick={(p) => navigate(`/app/plans/${p.id}`)}
        actions={(row) => [
          {
            id: 'view',
            label: 'View details',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/app/plans/${row.id}`),
          },
        ]}
        emptyTitle="No plans configured"
        emptyDescription="Create pricing plans to start enrolling customer subscriptions."
      />
    </div>
  );
}
