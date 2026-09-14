import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, PauseCircle, PlayCircle, XCircle, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/data/StatusBadge';
import { CurrencyDisplay } from '@/components/data/CurrencyDisplay';
import { DateDisplay } from '@/components/data/DateDisplay';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { Can } from '@/components/auth/Can';
import { PERMISSIONS } from '@/lib/permissions';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/contexts/ToastContext';

export function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const toast = useToast();

  const { data: subscription, isLoading, isError, refetch } = useQuery({
    queryKey: ['subscription', id],
    queryFn: () => apiClient.getSubscription(id || ''),
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

  if (isError || !subscription) {
    return (
      <ErrorState
        statusCode={404}
        title="Subscription Not Found"
        message="The subscription does not exist in the active organization context."
        onBack={() => navigate('/app/subscriptions')}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={subscription.subscriptionNumber}
        description={`${subscription.customerName} · ${subscription.planName}`}
        badge={<StatusBadge status={subscription.status} />}
        breadcrumbs={[
          { label: 'Subscriptions', href: '/app/subscriptions' },
          { label: subscription.subscriptionNumber },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/subscriptions')}
              leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
            >
              Back
            </Button>

            <Can permission={PERMISSIONS.SUBSCRIPTION_UPDATE}>
              {subscription.status === 'ACTIVE' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.warning('Subscription paused.', 'Command Executed')}
                  leftIcon={<PauseCircle className="h-3.5 w-3.5" />}
                >
                  Pause
                </Button>
              )}
              {subscription.status === 'PAUSED' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => toast.success('Subscription resumed.', 'Command Executed')}
                  leftIcon={<PlayCircle className="h-3.5 w-3.5" />}
                >
                  Resume
                </Button>
              )}
              {subscription.status === 'DRAFT' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => toast.success('Subscription confirmed.', 'Command Executed')}
                  leftIcon={<CheckCircle className="h-3.5 w-3.5" />}
                >
                  Confirm Terms
                </Button>
              )}
              {subscription.status !== 'CANCELLED' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => toast.error('Subscription cancellation requested.', 'Lifecycle Event')}
                  leftIcon={<XCircle className="h-3.5 w-3.5" />}
                >
                  Cancel
                </Button>
              )}
            </Can>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Contract Total
          </span>
          <div className="mt-1">
            <CurrencyDisplay
              amount={subscription.amount || '0'}
              currencyCode={subscription.currencyCode}
              className="text-base font-bold"
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Start Date
          </span>
          <span className="text-base font-semibold text-slate-900 mt-1 block">
            <DateDisplay date={subscription.startDate} />
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Billing Terms
          </span>
          <span className="text-base font-semibold text-slate-900 mt-1 block">
            {subscription.paymentTerms || 'Standard (NET 30)'}
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Auto-Renewal
          </span>
          <span className="text-base font-semibold text-slate-900 mt-1 block">
            {subscription.autoRenew ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'overview', label: 'Commercial Terms' },
          { id: 'items', label: 'Snapshotted Items' },
          { id: 'events', label: 'Event History' },
        ]}
        className="mb-5"
      />

      {activeTab === 'overview' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Subscription Details</h4>
          <dl className="divide-y divide-slate-100 text-xs">
            <div className="flex justify-between py-2">
              <dt className="text-slate-500">Subscription Number</dt>
              <dd className="font-semibold text-slate-900 tabular-nums">{subscription.subscriptionNumber}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-slate-500">Customer</dt>
              <dd className="font-medium text-slate-900">{subscription.customerName}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-slate-500">Plan</dt>
              <dd className="font-medium text-slate-900">{subscription.planName}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-slate-500">Billing Start Date</dt>
              <dd className="font-medium text-slate-900"><DateDisplay date={subscription.billingStartDate} /></dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-slate-500">Expiration / Term End</dt>
              <dd className="font-medium text-slate-900"><DateDisplay date={subscription.expirationDate} /></dd>
            </div>
          </dl>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Commercial Items Snapshot</h4>
          <p className="text-xs text-slate-500 mb-4">
            Items snapshotted at agreement time. Future catalog price edits do not alter these terms.
          </p>
          <div className="divide-y divide-slate-100 text-xs">
            {subscription.items?.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-900 block">{item.descriptionSnapshot}</span>
                  <span className="text-slate-400 text-[11px]">Qty: {item.quantity}</span>
                </div>
                <CurrencyDisplay amount={item.unitPrice} currencyCode={item.currencyCode} />
              </div>
            )) || <p className="text-xs text-slate-400">No items available.</p>}
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Audit & Lifecycle Timeline</h4>
          <div className="space-y-3">
            {subscription.events?.map((ev) => (
              <div key={ev.id} className="flex items-start gap-3 text-xs border-l-2 border-slate-300 pl-3 py-1">
                <div>
                  <span className="font-semibold text-slate-900 block">{ev.eventType}</span>
                  <span className="text-[11px] text-slate-400">
                    by {ev.actorName || 'System'} · <DateDisplay date={ev.occurredAt} mode="datetime" />
                  </span>
                </div>
              </div>
            )) || <p className="text-xs text-slate-400">No events recorded.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
