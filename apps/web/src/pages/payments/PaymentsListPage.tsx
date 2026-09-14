import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye } from 'lucide-react';
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
import type { Payment } from '@/types';

export function PaymentsListPage() {
  const { activeOrg } = useOrganization();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();
  const toast = useToast();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['payments', activeOrg?.id, search, statusFilter],
    queryFn: () => apiClient.getPayments(),
  });

  const rawPayments = data?.data || [];
  const filteredPayments = rawPayments.filter((p) => {
    const matchesSearch =
      !search ||
      p.paymentNumber.toLowerCase().includes(search.toLowerCase()) ||
      (p.customerName && p.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnDef<Payment>[] = [
    {
      id: 'paymentNumber',
      header: 'Payment #',
      accessorKey: 'paymentNumber',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-slate-900 tabular-nums">
          {row.paymentNumber}
        </span>
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
      id: 'invoiceNumber',
      header: 'Applied Invoice',
      accessorKey: 'invoiceNumber',
      cell: (row) => (
        <span className="font-medium text-slate-800 tabular-nums">{row.invoiceNumber || '—'}</span>
      ),
    },
    {
      id: 'paymentDate',
      header: 'Settlement Date',
      accessorKey: 'paymentDate',
      sortable: true,
      cell: (row) => <DateDisplay date={row.paymentDate} />,
    },
    {
      id: 'paymentMethod',
      header: 'Method',
      accessorKey: 'paymentMethod',
      cell: (row) => (
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
          {row.paymentMethod.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      id: 'amount',
      header: 'Amount Paid',
      accessorKey: 'amount',
      align: 'right',
      sortable: true,
      cell: (row) => (
        <CurrencyDisplay
          amount={row.amount}
          currencyCode={row.currencyCode}
          align="right"
          className="font-bold text-emerald-700"
        />
      ),
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
        title="Payments"
        description="Immutable settlement receipts applied towards invoice balances."
        actions={
          <Can permission={PERMISSIONS.PAYMENT_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => toast.info('Record payment flow ready for Phase 12.', 'Record Payment')}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Record Payment
            </Button>
          </Can>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter payments by PAY- number, customer, or invoice..."
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={[
          { label: 'Settled', value: 'SETTLED' },
          { label: 'Refunded', value: 'REFUNDED' },
          { label: 'Failed', value: 'FAILED' },
        ]}
        isFiltered={Boolean(search || statusFilter !== 'ALL')}
        onReset={() => {
          setSearch('');
          setStatusFilter('ALL');
        }}
      />

      <DataTable
        columns={columns}
        data={filteredPayments}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
        onRowClick={(p) => navigate(`/app/payments/${p.id}`)}
        actions={(row) => [
          {
            id: 'view',
            label: 'View payment receipt',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/app/payments/${row.id}`),
          },
        ]}
        emptyTitle="No payments recorded"
        emptyDescription="Payments recorded against finalized invoices will appear here."
      />
    </div>
  );
}
