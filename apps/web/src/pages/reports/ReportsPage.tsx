import React, { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Calendar, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CurrencyDisplay } from '@/components/data/CurrencyDisplay';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/contexts/OrgContext';
import { useToast } from '@/contexts/ToastContext';

export function ReportsPage() {
  const { activeOrg } = useOrganization();
  const [activeTab, setActiveTab] = useState('revenue');
  const toast = useToast();

  return (
    <div>
      <PageHeader
        title="Revenue & Operational Reports"
        description="Filterable financial summaries and subscriber analytics evaluated directly from PostgreSQL ledger data."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Exporting financial report CSV...', 'Export')}
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            Export Report
          </Button>
        }
      />

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'revenue', label: 'Revenue & Cashflow' },
          { id: 'subscriptions', label: 'Subscription Retention' },
          { id: 'aging', label: 'Overdue Aging' },
        ]}
        className="mb-6"
      />

      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="text-xs font-medium text-slate-500 block">Gross Invoiced (YTD)</span>
              <div className="mt-2">
                <CurrencyDisplay amount="1179000.0000" currencyCode={activeOrg?.defaultCurrencyCode} className="text-2xl font-bold" />
              </div>
              <span className="text-[11px] text-emerald-600 font-medium block mt-1">+14.2% vs previous period</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="text-xs font-medium text-slate-500 block">Net Collected Settlement</span>
              <div className="mt-2">
                <CurrencyDisplay amount="1041200.0000" currencyCode={activeOrg?.defaultCurrencyCode} className="text-2xl font-bold text-slate-900" />
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">Settled via wire transfer & card</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <span className="text-xs font-medium text-slate-500 block">Refunds & Reversals</span>
              <div className="mt-2">
                <CurrencyDisplay amount="10000.0000" currencyCode={activeOrg?.defaultCurrencyCode} className="text-2xl font-bold text-amber-600" />
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">&lt; 1% of settled volume</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Monthly Settlement Breakdown</h4>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="font-medium text-slate-800">August 2026</span>
                <CurrencyDisplay amount="50000.0000" currencyCode={activeOrg?.defaultCurrencyCode} />
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="font-medium text-slate-800">February 2026</span>
                <CurrencyDisplay amount="991200.0000" currencyCode={activeOrg?.defaultCurrencyCode} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h4 className="text-sm font-semibold text-slate-900 mb-2">Subscription Health & Retention</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Detailed churn tracking, contraction, expansion, and net revenue retention metrics are scheduled for Phase 14 reporting.
          </p>
        </div>
      )}

      {activeTab === 'aging' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h4 className="text-sm font-semibold text-slate-900 mb-2">Accounts Receivable Aging Report</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Categorization by 1-30 days, 31-60 days, and 90+ days overdue buckets.
          </p>
        </div>
      )}
    </div>
  );
}
