import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/data/StatusBadge';
import { CurrencyDisplay } from '@/components/data/CurrencyDisplay';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/contexts/ToastContext';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const toast = useToast();

  const { data: product, isLoading, isError, refetch } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiClient.getProduct(id || ''),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <ErrorState
        statusCode={404}
        title="Product Not Found"
        message="The requested product does not exist in the active organization context."
        onBack={() => navigate('/app/products')}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={product.name}
        description={product.description || 'Catalog offering'}
        badge={<StatusBadge status={product.status} />}
        breadcrumbs={[
          { label: 'Products', href: '/app/products' },
          { label: product.productCode },
        ]}
        actions={
          <div className="flex items-center flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/products')}
              leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => toast.info(`Editing ${product.productCode}`, 'Edit Product')}
              leftIcon={<Edit className="h-3.5 w-3.5" />}
            >
              Edit Product
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block">
            Product Code
          </span>
          <span className="text-base font-semibold text-slate-900 tabular-nums mt-1 block">
            {product.productCode}
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block">
            Product Type
          </span>
          <span className="text-base font-semibold text-slate-900 mt-1 block">
            {product.productType}
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block">
            Base Internal Cost
          </span>
          <div className="mt-1">
            <CurrencyDisplay
              amount={product.costPrice}
              currencyCode={product.costCurrencyCode}
              className="text-base font-bold"
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block">
            Configured Variants
          </span>
          <span className="text-base font-semibold text-slate-900 mt-1 block">
            {product.variants?.length || 0}
          </span>
        </div>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'variants', label: 'SKU Variants' },
        ]}
        className="mb-5"
      />

      {activeTab === 'overview' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Product Overview</h4>
          <p className="text-xs text-slate-600 leading-relaxed">{product.description || 'No extended description.'}</p>
        </div>
      )}

      {activeTab === 'variants' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Product SKU Variants</h4>
          <div className="divide-y divide-slate-100 text-xs">
            {product.variants?.map((v) => (
              <div key={v.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">{v.name}</span>
                  <span className="text-slate-400 font-mono text-sm">SKU: {v.sku}</span>
                </div>
                <StatusBadge status={v.status} />
              </div>
            )) || <p className="text-xs text-slate-400">No variants configured.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
