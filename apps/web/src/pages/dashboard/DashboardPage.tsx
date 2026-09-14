import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Plus,
  ArrowUpRight,
  Receipt,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/auth/Can';
import { PERMISSIONS } from '@/lib/permissions';
import { apiClient } from '@/lib/api-client';
import { useOrganization } from '@/contexts/OrgContext';
import { CurrencyDisplay } from '@/components/data/CurrencyDisplay';
import { StatusBadge } from '@/components/data/StatusBadge';
import { DateDisplay } from '@/components/data/DateDisplay';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardPage() {
  const { activeOrg } = useOrganization();
  const navigate = useNavigate();

  const { data: subscriptionsData, isLoading: isSubsLoading } = useQuery({
    queryKey: ['subscriptions', activeOrg?.id],
    queryFn: () => apiClient.getSubscriptions(),
  });

  const { data: invoicesData, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['invoices', activeOrg?.id],
    queryFn: () => apiClient.getInvoices(),
  });

  const { data: quotationsData } = useQuery({
    queryKey: ['quotations', activeOrg?.id],
    queryFn: () => apiClient.getQuotations(),
  });

  const subscriptions = subscriptionsData?.data || [];
  const invoices = invoicesData?.data || [];
  const quotations = quotationsData?.data || [];

  const activeSubsCount = subscriptions.filter((s) => s.status === 'ACTIVE').length;
  const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE');
  const pendingQuotationsCount = quotations.filter((q) => q.status === 'ISSUED').length;

  return (
    <div>
      <PageHeader
        title="Revenue Operations Overview"
        description={`Operational dashboard for ${activeOrg?.name || 'Active Tenant'} (${activeOrg?.defaultCurrencyCode} · ${activeOrg?.timezone})`}
        actions={
          <div className="flex items-center gap-2">
            <Can permission={PERMISSIONS.CUSTOMER_CREATE}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/customers')}
                leftIcon={<Users className="h-3.5 w-3.5" />}
              >
                New Customer
              </Button>
            </Can>
            <Can permission={PERMISSIONS.SUBSCRIPTION_CREATE}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/app/subscriptions')}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
              >
                New Subscription
              </Button>
            </Can>
          </div>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Active Subscriptions */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Subscriptions</span>
            <div className="rounded-md bg-emerald-50 p-1.5 text-emerald-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            {isSubsLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {activeSubsCount}
              </span>
            )}
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Across enterprise accounts
            </span>
          </div>
        </div>

        {/* Total Invoiced Volume */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Invoiced (YTD)</span>
            <div className="rounded-md bg-slate-100 p-1.5 text-slate-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            {isInvoicesLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <div className="text-xl font-bold tracking-tight text-slate-900">
                <CurrencyDisplay amount="1179000.0000" currencyCode={activeOrg?.defaultCurrencyCode} />
              </div>
            )}
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Authoritative ledger totals
            </span>
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Overdue Invoices</span>
            <div className="rounded-md bg-rose-50 p-1.5 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            {isInvoicesLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-rose-600 tabular-nums">
                  {overdueInvoices.length}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  <CurrencyDisplay
                    amount={overdueInvoices[0]?.amountDue || '0'}
                    currencyCode={activeOrg?.defaultCurrencyCode}
                  />
                </span>
              </div>
            )}
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Requiring collections follow-up
            </span>
          </div>
        </div>

        {/* Pending Quotes */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Quotations</span>
            <div className="rounded-md bg-amber-50 p-1.5 text-amber-600">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {pendingQuotationsCount}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Awaiting customer acceptance
            </span>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Subscriptions */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Active Subscriptions</h3>
              <p className="text-[11px] text-slate-500">Recent customer contracts & terms</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/subscriptions')}
              rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
              className="text-xs h-7"
            >
              View all
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {subscriptions.slice(0, 4).map((sub) => (
              <div
                key={sub.id}
                onClick={() => navigate(`/app/subscriptions/${sub.id}`)}
                className="flex items-center justify-between py-3 hover:bg-slate-50/70 px-2 rounded-md transition-colors cursor-pointer"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900">
                      {sub.subscriptionNumber}
                    </span>
                    <StatusBadge status={sub.status} />
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{sub.customerName}</p>
                </div>
                <div className="text-right shrink-0">
                  <CurrencyDisplay
                    amount={sub.amount || '0'}
                    currencyCode={sub.currencyCode}
                    align="right"
                  />
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Start <DateDisplay date={sub.startDate} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overdue / Recent Invoices */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent Invoices</h3>
              <p className="text-[11px] text-slate-500">Billing milestones & settlement state</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/invoices')}
              rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
              className="text-xs h-7"
            >
              View all
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {invoices.slice(0, 4).map((inv) => (
              <div
                key={inv.id}
                onClick={() => navigate(`/app/invoices/${inv.id}`)}
                className="flex items-center justify-between py-3 hover:bg-slate-50/70 px-2 rounded-md transition-colors cursor-pointer"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900">
                      {inv.invoiceNumber}
                    </span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{inv.customerName}</p>
                </div>
                <div className="text-right shrink-0">
                  <CurrencyDisplay
                    amount={inv.grandTotal}
                    currencyCode={inv.currencyCode}
                    align="right"
                  />
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Due <DateDisplay date={inv.dueDate} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
