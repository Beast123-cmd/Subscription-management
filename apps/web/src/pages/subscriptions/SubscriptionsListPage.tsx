import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, PauseCircle, PlayCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/data/FilterBar';
import { DataTable, type ColumnDef } from '@/components/data/DataTable';
import { StatusBadge } from '@/components/data/StatusBadge';
import { CurrencyDisplay } from '@/components/data/CurrencyDisplay';
import { DateDisplay } from '@/components/data/DateDisplay';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/auth/Can';
import { PERMISSIONS } from '@/lib/permissions';
import { apiClient } from '@/lib/api-client';
import { useOrganization } from '@/contexts/OrgContext';
import { useToast } from '@/contexts/ToastContext';
import type { Subscription } from '@/types';

export function SubscriptionsListPage() {
  const { activeOrg } = useOrganization();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const navigate = useNavigate();
  const toast = useToast();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['subscriptions', activeOrg?.id, search, statusFilter],
    queryFn: () => apiClient.getSubscriptions(),
  });

  const rawSubscriptions = data?.data || [];
  const filteredSubscriptions = rawSubscriptions.filter((s) => {
    const matchesSearch =
      !search ||
      s.subscriptionNumber.toLowerCase().includes(search.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (s.planName && s.planName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnDef<Subscription>[] = [
    {
      id: 'subscriptionNumber',
      header: 'Subscription #',
      accessorKey: 'subscriptionNumber',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-slate-900 tabular-nums">
          {row.subscriptionNumber}
        </span>
      ),
    },
    {
      id: 'customerName',
      header: 'Customer',
      accessorKey: 'customerName',
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-slate-900">{row.customerName || '—'}</span>
      ),
    },
    {
      id: 'planName',
      header: 'Plan Offering',
      accessorKey: 'planName',
      cell: (row) => <span className="text-xs text-slate-700">{row.planName || 'Custom Plan'}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'startDate',
      header: 'Start Date',
      accessorKey: 'startDate',
      sortable: true,
      cell: (row) => <DateDisplay date={row.startDate} />,
    },
    {
      id: 'amount',
      header: 'Recurring Amount',
      accessorKey: 'amount',
      align: 'right',
      sortable: true,
      cell: (row) => (
        <CurrencyDisplay
          amount={row.amount || '0'}
          currencyCode={row.currencyCode}
          align="right"
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description="Active customer subscriptions, recurring terms, amendments, and lifecycle state machines."
        actions={
          <Can permission={PERMISSIONS.SUBSCRIPTION_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => toast.info('Subscription creation workflow ready for Phase 9.', 'New Subscription')}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              New Subscription
            </Button>
          </Can>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter by SUB- number, customer, or plan..."
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={[
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Paused', value: 'PAUSED' },
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ]}
        isFiltered={Boolean(search || statusFilter !== 'ALL')}
        onReset={() => {
          setSearch('');
          setStatusFilter('ALL');
        }}
      />

      <DataTable
        columns={columns}
        data={filteredSubscriptions}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
        onRowClick={(s) => navigate(`/app/subscriptions/${s.id}`)}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        actions={(row) => [
          {
            id: 'view',
            label: 'View details',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/app/subscriptions/${row.id}`),
          },
          ...(row.status === 'ACTIVE'
            ? [
                {
                  id: 'pause',
                  label: 'Pause subscription',
                  icon: <PauseCircle className="h-3.5 w-3.5" />,
                  onClick: () => toast.warning(`Paused ${row.subscriptionNumber}`, 'Subscription Paused'),
                },
              ]
            : []),
          ...(row.status === 'PAUSED'
            ? [
                {
                  id: 'resume',
                  label: 'Resume subscription',
                  icon: <PlayCircle className="h-3.5 w-3.5" />,
                  onClick: () => toast.success(`Resumed ${row.subscriptionNumber}`, 'Subscription Resumed'),
                },
              ]
            : []),
          {
            id: 'cancel',
            label: 'Cancel subscription',
            icon: <XCircle className="h-3.5 w-3.5" />,
            destructive: true,
            onClick: () => toast.error(`Cancelled ${row.subscriptionNumber}`, 'Subscription Cancelled'),
          },
        ]}
        emptyTitle="No subscriptions yet"
        emptyDescription="Subscriptions will appear here once customers are enrolled in a plan."
        emptyAction={
          <Can permission={PERMISSIONS.SUBSCRIPTION_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => toast.info('Subscription creation modal ready for Phase 9.', 'Create Subscription')}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Create Subscription
            </Button>
          </Can>
        }
      />
    </div>
  );
}
