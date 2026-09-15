import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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

export function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('prices');
  const navigate = useNavigate();
  const toast = useToast();

  const { data: plan, isLoading, isError, refetch } = useQuery({
    queryKey: ['plan', id],
    queryFn: () => apiClient.getPlan(id || ''),
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
            {plan.prices?.map((prc) => (
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
            )) || <p className="text-xs text-slate-400">No prices configured.</p>}
          </div>
        </div>
      )}

      {activeTab === 'details' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Plan Details</h4>
          <p className="text-xs text-slate-600 leading-relaxed">{plan.description || 'No extended description.'}</p>
        </div>
      )}
    </div>
  );
}
