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
import { Input } from '@/components/ui/input';
import { PlanSelect } from '@/components/data/PlanSelect';
import { Select } from '@/components/ui/select';
import { CustomerSelect } from '@/components/data/CustomerSelect';
import { useCommand } from '@/lib/use-command';

export function SubscriptionsListPage() {
  const { activeOrg } = useOrganization();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('MONTHLY');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { run } = useCommand();
  const reason = (action: string) => window.prompt(`Reason for ${action}:`)?.trim();

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
        <span className="font-semibold text-slate-900 tabular-nums">{row.subscriptionNumber}</span>
      ),
    },
    {
      id: 'customerName',
      header: 'Customer',
      accessorKey: 'customerName',
      sortable: true,
      cell: (row) => <span className="font-medium text-slate-900">{row.customerName || '—'}</span>,
    },
    {
      id: 'planName',
      header: 'Plan Offering',
      accessorKey: 'planName',
      cell: (row) => (
        <span className="text-xs text-slate-700">{row.planName || 'Custom Plan'}</span>
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
        <CurrencyDisplay amount={row.amount || '0'} currencyCode={row.currencyCode} align="right" />
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
              onClick={() => setFormOpen(true)}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              New Subscription
            </Button>
          </Can>
        }
      />

      {formOpen && (
        <form
          className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            if (saving) return;
            setSaving(true);
            try {
              await apiClient.createSubscription({
                customerId,
                planId,
                currencyCode: activeOrg?.defaultCurrencyCode ?? 'INR',
                billingPeriod,
                startDate,
                billingStartDate: startDate,
              });
              toast.success('Subscription created.', 'Success');
              setFormOpen(false);
              await refetch();
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : 'Unable to create subscription.',
                'Subscription failed',
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="mb-4 text-sm font-semibold">New subscription</div>
          <div className="grid gap-3 md:grid-cols-3">
            <CustomerSelect key={activeOrg?.id} value={customerId} onChange={setCustomerId} />
            <PlanSelect key={activeOrg?.id} value={planId} onChange={setPlanId} />
            <Select
              label="Billing period"
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value as typeof billingPeriod)}
              options={[
                { value: 'MONTHLY', label: 'Monthly' },
                { value: 'QUARTERLY', label: 'Quarterly' },
                { value: 'ANNUAL', label: 'Annual' },
              ]}
            />
            <Input
              label="Start date"
              required
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" isLoading={saving}>
              Create subscription
            </Button>
            <Button
              type="button"
              disabled={saving}
              variant="secondary"
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
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
                  onClick: () => { const value = reason(`pausing ${row.subscriptionNumber}`); if (value) void run(`/subscriptions/${row.id}/pause`, `Subscription ${row.subscriptionNumber} paused.`, undefined, { reason: value }); },
                },
              ]
            : []),
          ...(row.status === 'PAUSED'
            ? [
                {
                  id: 'resume',
                  label: 'Resume subscription',
                  icon: <PlayCircle className="h-3.5 w-3.5" />,
                  onClick: () => { const value = reason(`resuming ${row.subscriptionNumber}`); if (value) void run(`/subscriptions/${row.id}/resume`, `Subscription ${row.subscriptionNumber} resumed.`, undefined, { reason: value }); },
                },
              ]
            : []),
          ...(['DRAFT', 'CONFIRMED', 'ACTIVE', 'PAUSED'].includes(row.status) ? [{
            id: 'cancel',
            label: 'Cancel subscription',
            icon: <XCircle className="h-3.5 w-3.5" />,
            destructive: true,
            onClick: () => { const value = reason(`cancelling ${row.subscriptionNumber}`); if (value) void run(`/subscriptions/${row.id}/cancel`, `Subscription ${row.subscriptionNumber} cancelled.`, `Cancel ${row.subscriptionNumber}?`, { reason: value }); },
          }] : []),
        ]}
        emptyTitle="No subscriptions yet"
        emptyDescription="Subscriptions will appear here once customers are enrolled in a plan."
        emptyAction={
          <Can permission={PERMISSIONS.SUBSCRIPTION_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setFormOpen(true)}
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
