import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/data/FilterBar';
import { DataTable, type ColumnDef } from '@/components/data/DataTable';
import { CurrencyDisplay } from '@/components/data/CurrencyDisplay';
import { DateDisplay } from '@/components/data/DateDisplay';
import { apiClient } from '@/lib/api-client';
import { useOrganization } from '@/contexts/OrgContext';
import type { Refund } from '@/types';

export function RefundsListPage() {
  const { activeOrg } = useOrganization();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['refunds', activeOrg?.id, search],
    queryFn: () => apiClient.getRefunds(),
  });

  const rawRefunds = data?.data || [];
  const filteredRefunds = rawRefunds.filter((r) => {
    return (
      !search ||
      r.refundNumber.toLowerCase().includes(search.toLowerCase()) ||
      (r.paymentNumber && r.paymentNumber.toLowerCase().includes(search.toLowerCase())) ||
      (r.invoiceNumber && r.invoiceNumber.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const columns: ColumnDef<Refund>[] = [
    {
      id: 'refundNumber',
      header: 'Refund #',
      accessorKey: 'refundNumber',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-slate-900 tabular-nums">
          {row.refundNumber}
        </span>
      ),
    },
    {
      id: 'paymentNumber',
      header: 'Source Payment',
      accessorKey: 'paymentNumber',
      cell: (row) => (
        <span className="font-medium text-slate-800 tabular-nums">{row.paymentNumber || '—'}</span>
      ),
    },
    {
      id: 'invoiceNumber',
      header: 'Source Invoice',
      accessorKey: 'invoiceNumber',
      cell: (row) => (
        <span className="font-medium text-slate-800 tabular-nums">{row.invoiceNumber || '—'}</span>
      ),
    },
    {
      id: 'reason',
      header: 'Reason / Commercial Note',
      accessorKey: 'reason',
      cell: (row) => <span className="text-xs text-slate-600 truncate max-w-sm block">{row.reason}</span>,
    },
    {
      id: 'amount',
      header: 'Refunded Amount',
      accessorKey: 'amount',
      align: 'right',
      sortable: true,
      cell: (row) => (
        <CurrencyDisplay
          amount={row.amount}
          currencyCode={row.currencyCode}
          align="right"
          className="font-bold text-amber-700"
        />
      ),
    },
    {
      id: 'createdAt',
      header: 'Processed At',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => <DateDisplay date={row.createdAt} mode="datetime" />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Refunds"
        description="Immutable financial reversals recorded against prior settlement transactions."
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter refunds by REF- number or payment..."
        isFiltered={Boolean(search)}
        onReset={() => setSearch('')}
      />

      <DataTable
        columns={columns}
        data={filteredRefunds}
        keyExtractor={(r) => r.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
        emptyTitle="No refunds recorded"
        emptyDescription="Settled refunds and pro-rata credit reversals will appear here."
      />
    </div>
  );
}
