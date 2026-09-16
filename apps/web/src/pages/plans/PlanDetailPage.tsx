import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/data/StatusBadge';
import { CurrencyDisplay } from '@/components/data/CurrencyDisplay';
import { DateDisplay } from '@/components/data/DateDisplay';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/contexts/ToastContext';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useOrganization } from '@/contexts/OrgContext';

export function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('prices');
  const navigate = useNavigate();
  const toast = useToast();
  const cache = useQueryClient();
  const { activeOrg } = useOrganization();
  const [itemOpen, setItemOpen] = useState(false); const [priceOpen, setPriceOpen] = useState(false); const [productId, setProductId] = useState(''); const [quantity, setQuantity] = useState('1'); const [amount, setAmount] = useState(''); const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('MONTHLY'); const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10)); const [saving, setSaving] = useState(false);

  const { data: plan, isLoading, isError, refetch } = useQuery({
    queryKey: ['plan', id],
    queryFn: () => apiClient.getPlan(id || ''),
    enabled: Boolean(id),
  });
  const items = useQuery({ queryKey: ['plan-items', id], queryFn: () => apiClient.getPlanItems(id || ''), enabled: Boolean(id) });
  const prices = useQuery({ queryKey: ['plan-prices', id], queryFn: () => apiClient.getPlanPrices(id || ''), enabled: Boolean(id) });
  const products = useQuery({ queryKey: ['products', activeOrg?.id], queryFn: () => apiClient.getProducts(), enabled: itemOpen && Boolean(activeOrg) });
  async function addItem(event: React.FormEvent) { event.preventDefault(); if (!id || saving) return; setSaving(true); try { await apiClient.addPlanItem(id, { productId, quantity: Number(quantity) }); setProductId(''); setQuantity('1'); setItemOpen(false); await cache.invalidateQueries({ queryKey: ['plan-items', id] }); toast.success('Plan item added.', 'Saved'); } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to add plan item.', 'Item failed'); } finally { setSaving(false); } }
  async function addPrice(event: React.FormEvent) { event.preventDefault(); if (!id || saving) return; setSaving(true); try { await apiClient.addPlanPrice(id, { currencyCode: activeOrg?.defaultCurrencyCode ?? 'INR', billingPeriod, amount, effectiveFrom }); setAmount(''); setPriceOpen(false); await cache.invalidateQueries({ queryKey: ['plan-prices', id] }); toast.success('Price added.', 'Saved'); } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to add price.', 'Price failed'); } finally { setSaving(false); } }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <ErrorState
        statusCode={404}
        title="Plan Not Found"
        message="The requested plan does not exist in the active organization context."
        onBack={() => navigate('/app/plans')}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={plan.name}
        description={plan.description || 'Configured plan offering'}
        badge={<StatusBadge status={plan.status} />}
        breadcrumbs={[
          { label: 'Plans & Pricing', href: '/app/plans' },
          { label: plan.planCode },
        ]}
        actions={
          <div className="flex items-center flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/plans')}
              leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => toast.info(`Editing plan ${plan.planCode}`, 'Edit Plan')}
              leftIcon={<Edit className="h-3.5 w-3.5" />}
            >
              Edit Plan
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block">
            Plan Code
          </span>
          <span className="text-base font-semibold text-slate-900 tabular-nums mt-1 block">
            {plan.planCode}
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block">
            Min Quantity
          </span>
          <span className="text-base font-semibold text-slate-900 mt-1 block">
            {plan.minimumQuantity}
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block">
            Pausable
          </span>
          <span className="text-base font-semibold text-slate-900 mt-1 block">
            {plan.pausable ? 'Yes' : 'No'}
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block">
            Auto-Close
          </span>
          <span className="text-base font-semibold text-slate-900 mt-1 block">
            {plan.autoClose ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'prices', label: 'Effective-Dated Prices' },
          { id: 'items', label: 'Included items' },
          { id: 'details', label: 'Overview' },
        ]}
        className="mb-5"
      />

      {activeTab === 'prices' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Effective Pricing Schedule</h4>
              <p className="text-xs text-slate-500">
                Start-inclusive and end-exclusive intervals: [effective_from, effective_until)
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <Button size="sm" variant="outline" onClick={() => setPriceOpen((value) => !value)}>Add price</Button>
          </div>
          {priceOpen && <form className="mb-4 grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-3" onSubmit={addPrice}><Input label="Amount" required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /><Select label="Billing period" value={billingPeriod} onChange={(event) => setBillingPeriod(event.target.value as typeof billingPeriod)} options={[{ value: 'MONTHLY', label: 'Monthly' }, { value: 'QUARTERLY', label: 'Quarterly' }, { value: 'ANNUAL', label: 'Annual' }]} /><Input label="Effective from" required type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} /><div className="sm:col-span-3 flex gap-2"><Button type="submit" isLoading={saving}>Save price</Button><Button type="button" variant="secondary" onClick={() => setPriceOpen(false)}>Cancel</Button></div></form>}
          <div className="divide-y divide-slate-100 text-xs">
            {prices.data?.data.map((prc) => (
              <div key={prc.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">
                    {prc.billingPeriod} ({prc.currencyCode})
                  </span>
                  <span className="text-slate-400 text-sm">
                    Effective from: <DateDisplay date={prc.effectiveFrom} /> · Until: {prc.effectiveUntil ? <DateDisplay date={prc.effectiveUntil} /> : 'Open-ended'}
                  </span>
                </div>
                <div className="text-right">
                  <CurrencyDisplay amount={prc.amount} currencyCode={prc.currencyCode} align="right" />
                  <div className="mt-0.5">
                    <StatusBadge status={prc.status} />
                  </div>
                </div>
              </div>
            ))}{prices.isSuccess && !prices.data.data.length && <p className="text-xs text-slate-400">No prices configured.</p>}
          </div>
        </div>
      )}

      {activeTab === 'items' && <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs"><div className="flex items-center justify-between gap-3"><div><h4 className="text-sm font-semibold text-slate-900">Included items</h4><p className="mt-1 text-xs text-slate-500">Products delivered with this plan.</p></div><Button size="sm" variant="outline" onClick={() => setItemOpen((value) => !value)}>Add item</Button></div>{itemOpen && <form className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-[1fr_160px_auto] sm:items-end" onSubmit={addItem}><Select label="Product" required value={productId} onChange={(event) => setProductId(event.target.value)} disabled={products.isPending} options={[{ value: '', label: products.isPending ? 'Loading products…' : 'Choose product' }, ...(products.data?.data ?? []).filter((product) => product.status === 'ACTIVE').map((product) => ({ value: product.id, label: `${product.name} · ${product.productCode}` }))]} /><Input label="Quantity" required type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /><Button type="submit" isLoading={saving}>Save item</Button></form>}<div className="mt-4 divide-y divide-slate-100">{items.data?.data.map((item) => <div key={item.id} className="flex items-center justify-between py-3 text-sm"><span className="font-medium text-slate-900">Product {item.productId.slice(0, 8)}</span><span className="text-slate-600">Qty {item.quantity}</span></div>)}{items.isSuccess && !items.data.data.length && <p className="py-4 text-sm text-slate-600">No items configured.</p>}</div></div>}

      {activeTab === 'details' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Plan Details</h4>
          <p className="text-xs text-slate-600 leading-relaxed">{plan.description || 'No extended description.'}</p>
        </div>
      )}
    </div>
  );
}
