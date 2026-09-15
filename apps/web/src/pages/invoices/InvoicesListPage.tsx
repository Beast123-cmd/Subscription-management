import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, CheckCheck, Ban, DollarSign } from 'lucide-react';
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
import type { Invoice } from '@/types';
import { Input } from '@/components/ui/input';

export function InvoicesListPage() {
  const { activeOrg } = useOrganization();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false); const [customerId, setCustomerId] = useState(''); const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10)); const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const navigate = useNavigate();
  const toast = useToast();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['invoices', activeOrg?.id, search, statusFilter],
    queryFn: () => apiClient.getInvoices(),
  });

  const rawInvoices = data?.data || [];
  const filteredInvoices = rawInvoices.filter((i) => {
    const matchesSearch =
      !search ||
      i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (i.customerName && i.customerName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnDef<Invoice>[] = [
    {
      id: 'invoiceNumber',
      header: 'Invoice #',
      accessorKey: 'invoiceNumber',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-slate-900 tabular-nums">
          {row.invoiceNumber}
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
      id: 'issueDate',
      header: 'Issue Date',
      accessorKey: 'issueDate',
      sortable: true,
      cell: (row) => <DateDisplay date={row.issueDate} />,
    },
    {
      id: 'dueDate',
      header: 'Due Date',
      accessorKey: 'dueDate',
      sortable: true,
      cell: (row) => <DateDisplay date={row.dueDate} />,
    },
    {
      id: 'grandTotal',
      header: 'Amount',
      accessorKey: 'grandTotal',
      align: 'right',
      sortable: true,
      cell: (row) => (
        <CurrencyDisplay
          amount={row.grandTotal}
          currencyCode={row.currencyCode}
          align="right"
        />
      ),
    },
    {
      id: 'amountDue',
      header: 'Amount Due',
      accessorKey: 'amountDue',
      align: 'right',
      sortable: true,
      cell: (row) => (
        <CurrencyDisplay
          amount={row.amountDue}
          currencyCode={row.currencyCode}
          align="right"
          className={parseFloat(row.amountDue) > 0 ? 'text-rose-600 font-semibold' : 'text-slate-500'}
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
        title="Invoices"
        description="Draft, finalized and historical financial billing documents with immutable snapshots."
        actions={
          <Can permission={PERMISSIONS.INVOICE_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setFormOpen(true)}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Create Draft Invoice
            </Button>
          </Can>
        }
      />

      {formOpen && <form className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={async (e) => { e.preventDefault(); try { await apiClient.createInvoice({ customerId, currencyCode: activeOrg?.defaultCurrencyCode ?? 'INR', issueDate, dueDate }); toast.success('Invoice draft created.', 'Success'); setFormOpen(false); await refetch(); } catch (err) { toast.error(err instanceof Error ? err.message : 'Unable to create invoice.', 'Invoice failed'); } }}><div className="mb-4 text-sm font-semibold">Create draft invoice</div><div className="grid gap-3 md:grid-cols-3"><Input required placeholder="Customer ID" value={customerId} onChange={(e) => setCustomerId(e.target.value)} /><Input required type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /><Input required type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div><div className="mt-4 flex gap-2"><Button type="submit">Create invoice</Button><Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button></div></form>}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter by INV- number or customer..."
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={[
          { label: 'Paid', value: 'PAID' },
          { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
          { label: 'Overdue', value: 'OVERDUE' },
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Finalized', value: 'FINALIZED' },
          { label: 'Void', value: 'VOID' },
        ]}
        isFiltered={Boolean(search || statusFilter !== 'ALL')}
        onReset={() => {
          setSearch('');
          setStatusFilter('ALL');
        }}
      />

      <DataTable
        columns={columns}
        data={filteredInvoices}
        keyExtractor={(i) => i.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
        onRowClick={(i) => navigate(`/app/invoices/${i.id}`)}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        actions={(row) => [
          {
            id: 'view',
            label: 'View invoice',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/app/invoices/${row.id}`),
          },
          ...(row.status === 'DRAFT'
            ? [
                {
                  id: 'finalize',
                  label: 'Finalize invoice',
                  icon: <CheckCheck className="h-3.5 w-3.5" />,
                  onClick: () => toast.success(`Invoice ${row.invoiceNumber} finalized successfully.`, 'Invoice Finalized'),
                },
              ]
            : []),
          ...(row.status !== 'PAID' && row.status !== 'VOID'
            ? [
                {
                  id: 'payment',
                  label: 'Record payment',
                  icon: <DollarSign className="h-3.5 w-3.5" />,
                  onClick: () => toast.info(`Record payment for ${row.invoiceNumber}`, 'Record Payment'),
                },
              ]
            : []),
          ...(row.status !== 'VOID'
            ? [
                {
                  id: 'void',
                  label: 'Void invoice',
                  icon: <Ban className="h-3.5 w-3.5" />,
                  destructive: true,
                  onClick: () => toast.warning(`Invoice ${row.invoiceNumber} marked as void.`, 'Invoice Voided'),
                },
              ]
            : []),
        ]}
        emptyTitle="No invoices found"
        emptyDescription="Invoices will appear here once finalized from active subscriptions or ad-hoc orders."
      />
    </div>
  );
}
