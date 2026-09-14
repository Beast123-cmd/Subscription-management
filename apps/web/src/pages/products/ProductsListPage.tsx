import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, Edit, Archive } from 'lucide-react';
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
import type { Product } from '@/types';

export function ProductsListPage() {
  const { activeOrg } = useOrganization();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();
  const toast = useToast();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['products', activeOrg?.id, search, statusFilter],
    queryFn: () => apiClient.getProducts(),
  });

  const rawProducts = data?.data || [];
  const filteredProducts = rawProducts.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.productCode.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnDef<Product>[] = [
    {
      id: 'productCode',
      header: 'Product Code',
      accessorKey: 'productCode',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-slate-900 tabular-nums">
          {row.productCode}
        </span>
      ),
    },
    {
      id: 'name',
      header: 'Product Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-medium text-slate-900 block">{row.name}</span>
          <span className="text-[11px] text-slate-400 block truncate max-w-sm">{row.description}</span>
        </div>
      ),
    },
    {
      id: 'productType',
      header: 'Type',
      accessorKey: 'productType',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-slate-600 font-medium">{row.productType}</span>
      ),
    },
    {
      id: 'costPrice',
      header: 'Internal Cost',
      accessorKey: 'costPrice',
      align: 'right',
      cell: (row) => (
        <CurrencyDisplay
          amount={row.costPrice}
          currencyCode={row.costCurrencyCode}
          align="right"
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
        title="Products"
        description="Master catalog of sellable goods and recurring services."
        actions={
          <Can permission={PERMISSIONS.PRODUCT_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => toast.info('Product creation ready for Phase 7.', 'Create Product')}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Add Product
            </Button>
          </Can>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter by product name or code..."
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
        data={filteredProducts}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
        onRowClick={(p) => navigate(`/app/products/${p.id}`)}
        actions={(row) => [
          {
            id: 'view',
            label: 'View details',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/app/products/${row.id}`),
          },
          {
            id: 'edit',
            label: 'Edit product',
            icon: <Edit className="h-3.5 w-3.5" />,
            onClick: () => toast.info(`Editing ${row.productCode}`, 'Edit Product'),
          },
          {
            id: 'archive',
            label: 'Archive product',
            icon: <Archive className="h-3.5 w-3.5" />,
            destructive: true,
            onClick: () => toast.warning(`Archived ${row.productCode}`, 'Product Archived'),
          },
        ]}
        emptyTitle="No products configured"
        emptyDescription="Products form the foundation of plans, variants, and catalog offerings."
      />
    </div>
  );
}
