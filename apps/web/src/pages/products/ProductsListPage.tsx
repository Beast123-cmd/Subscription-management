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
import { Input } from '@/components/ui/input';

export function ProductsListPage() {
  const { activeOrg } = useOrganization();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formOpen, setFormOpen] = useState(false); const [code, setCode] = useState(''); const [name, setName] = useState(''); const [price, setPrice] = useState('0');
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
          <span className="text-sm text-slate-400 block truncate max-w-sm">{row.description}</span>
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
              onClick={() => setFormOpen(true)}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Add Product
            </Button>
          </Can>
        }
      />

      {formOpen && <form className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={async (e) => { e.preventDefault(); try { await apiClient.createProduct({ productCode: code, name, productType: 'SERVICE', costPrice: price, costCurrencyCode: activeOrg?.defaultCurrencyCode ?? 'INR' }); toast.success('Product created.', 'Success'); setFormOpen(false); await refetch(); } catch (err) { toast.error(err instanceof Error ? err.message : 'Unable to create product.', 'Product failed'); } }}><div className="mb-4 text-sm font-semibold">Add product</div><div className="grid gap-3 md:grid-cols-3"><Input required placeholder="Product code" value={code} onChange={(e) => setCode(e.target.value)} /><Input required placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} /><Input required placeholder="Cost price" value={price} onChange={(e) => setPrice(e.target.value)} /></div><div className="mt-4 flex gap-2"><Button type="submit">Create product</Button><Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button></div></form>}
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
