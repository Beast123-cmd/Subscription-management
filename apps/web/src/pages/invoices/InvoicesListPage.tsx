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

export function InvoicesListPage() {
  const { activeOrg } = useOrganization();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
              onClick={() => toast.info('Invoice draft creation will be enabled in Phase 11.', 'Create Invoice')}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Create Draft Invoice
            </Button>
          </Can>
        }
      />

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
