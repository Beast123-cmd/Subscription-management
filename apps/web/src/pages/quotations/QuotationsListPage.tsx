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
import type { Quotation } from '@/types';
import { Input } from '@/components/ui/input';
import { CustomerSelect } from '@/components/data/CustomerSelect';

export function QuotationsListPage() {
  const { activeOrg } = useOrganization();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['quotations', activeOrg?.id, search, statusFilter],
    queryFn: () => apiClient.getQuotations(),
  });

  const rawQuotations = data?.data || [];
  const filteredQuotations = rawQuotations.filter((q) => {
    const matchesSearch =
      !search ||
      q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      (q.customerName && q.customerName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnDef<Quotation>[] = [
    {
      id: 'quotationNumber',
      header: 'Quote #',
      accessorKey: 'quotationNumber',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-slate-900 tabular-nums">{row.quotationNumber}</span>
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
      id: 'validUntil',
      header: 'Valid Until',
      accessorKey: 'validUntil',
      sortable: true,
      cell: (row) => <DateDisplay date={row.validUntil} />,
    },
    {
      id: 'grandTotal',
      header: 'Total Value',
      accessorKey: 'grandTotal',
      align: 'right',
      sortable: true,
      cell: (row) => (
        <CurrencyDisplay amount={row.grandTotal} currencyCode={row.currencyCode} align="right" />
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
      header: 'Created',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => <DateDisplay date={row.createdAt} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quotations"
        description="Commercial quotes with validity intervals, acceptance lifecycle, and controlled subscription conversion."
        actions={
          <Can permission={PERMISSIONS.QUOTATION_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setFormOpen(true)}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              New Quotation
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
              await apiClient.createQuotation({
                customerId,
                currencyCode: activeOrg?.defaultCurrencyCode ?? 'INR',
                validUntil,
                items: [{ description, quantity: 1, unitPrice: price }],
              });
              toast.success('Quotation created.', 'Success');
              setFormOpen(false);
              await refetch();
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : 'Unable to create quotation.',
                'Quotation failed',
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="mb-4 text-sm font-semibold">New quotation</div>
          <div className="grid gap-3 md:grid-cols-4">
            <CustomerSelect key={activeOrg?.id} value={customerId} onChange={setCustomerId} />
            <Input
              label="Line description"
              required
              placeholder="Describe the service or item"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              label="Unit price"
              inputMode="decimal"
              required
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <Input
              label="Valid until"
              required
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" isLoading={saving}>
              Create quotation
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
        searchPlaceholder="Filter quotes by number or customer..."
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={[
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Issued', value: 'ISSUED' },
          { label: 'Accepted', value: 'ACCEPTED' },
          { label: 'Rejected', value: 'REJECTED' },
        ]}
        isFiltered={Boolean(search || statusFilter !== 'ALL')}
        onReset={() => {
          setSearch('');
          setStatusFilter('ALL');
        }}
      />

      <DataTable
        columns={columns}
        data={filteredQuotations}
        keyExtractor={(q) => q.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
        onRowClick={(q) => navigate(`/app/quotations/${q.id}`)}
        actions={(row) => [
          {
            id: 'view',
            label: 'View quote',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/app/quotations/${row.id}`),
          },
        ]}
        emptyTitle="No quotations found"
        emptyDescription="Draft quotations can be issued to prospective customers before subscription creation."
      />
    </div>
  );
}
