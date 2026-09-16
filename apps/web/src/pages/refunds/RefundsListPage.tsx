import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/data/FilterBar';
import { DataTable, type ColumnDef } from '@/components/data/DataTable';
import { CurrencyDisplay } from '@/components/data/CurrencyDisplay';
import { DateDisplay } from '@/components/data/DateDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';
import { useOrganization } from '@/contexts/OrgContext';
import { useToast } from '@/contexts/ToastContext';
import type { Refund } from '@/types';
import { Select } from '@/components/ui/select';

export function RefundsListPage() {
  const { activeOrg } = useOrganization();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [paymentId, setPaymentId] = useState(''); const [amount, setAmount] = useState(''); const [reason, setReason] = useState(''); const [saving, setSaving] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['refunds', activeOrg?.id, search],
    queryFn: () => apiClient.getRefunds(),
  });
  const paymentsQuery = useQuery({ queryKey: ['payments', activeOrg?.id], queryFn: () => apiClient.getPayments(), enabled: formOpen });
  const eligiblePayments = (paymentsQuery.data?.data ?? []).filter((payment) => payment.status === 'SETTLED');

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
        actions={<Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>Record Refund</Button>}
      />
      {formOpen && <form className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={async (e) => { e.preventDefault(); setSaving(true); try { await apiClient.createRefund({ paymentId, amount, reason }); toast.success('Refund recorded.', 'Success'); setFormOpen(false); setPaymentId(''); setAmount(''); setReason(''); await refetch(); } catch (err) { toast.error(err instanceof Error ? err.message : 'Unable to record refund.', 'Refund failed'); } finally { setSaving(false); } }}><div className="mb-4 text-sm font-semibold">Record refund</div><div className="grid gap-3 md:grid-cols-3"><Select required label="Settled payment" value={paymentId} onChange={(e) => setPaymentId(e.target.value)} disabled={paymentsQuery.isPending} options={[{ value: '', label: paymentsQuery.isPending ? 'Loading payments…' : 'Choose a payment' }, ...eligiblePayments.map((payment) => ({ value: payment.id, label: `${payment.paymentNumber} · ${payment.invoiceNumber ?? 'Invoice'} · ${payment.amount}` }))]} /><Input required label="Amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /><Input required label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} /></div><div className="mt-4 flex gap-2"><Button type="submit" isLoading={saving}>Save refund</Button><Button type="button" variant="secondary" disabled={saving} onClick={() => setFormOpen(false)}>Cancel</Button></div></form>}

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
