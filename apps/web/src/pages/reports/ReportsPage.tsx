import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CurrencyDisplay } from '@/components/data/CurrencyDisplay';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { useOrganization } from '@/contexts/OrgContext';

type Amounts = Record<string, number>;
const add = (amounts: Amounts, currency: string, amount: string) => ({ ...amounts, [currency]: (amounts[currency] ?? 0) + Number(amount) });

function AmountList({ amounts, empty = 'No activity recorded.' }: { amounts: Amounts; empty?: string }) {
  const rows = Object.entries(amounts);
  if (!rows.length) return <p className="mt-2 text-sm text-slate-500">{empty}</p>;
  return <div className="mt-2 space-y-1">{rows.map(([currency, amount]) => <CurrencyDisplay key={currency} amount={String(amount)} currencyCode={currency} className="text-2xl font-bold text-slate-900" />)}</div>;
}

function Metric({ label, amounts }: { label: string; amounts: Amounts }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs"><span className="text-sm font-medium text-slate-600">{label}</span><AmountList amounts={amounts} /></section>;
}

export function ReportsPage() {
  const { activeOrg } = useOrganization();
  const [activeTab, setActiveTab] = useState('revenue');
  const invoices = useQuery({ queryKey: ['invoice-summary', activeOrg?.id], queryFn: () => apiClient.getInvoiceSummary(), enabled: Boolean(activeOrg) });
  const payments = useQuery({ queryKey: ['payments', activeOrg?.id], queryFn: () => apiClient.getPayments(), enabled: Boolean(activeOrg) });
  const refunds = useQuery({ queryKey: ['refunds', activeOrg?.id], queryFn: () => apiClient.getRefunds(), enabled: Boolean(activeOrg) });
  const loading = invoices.isPending || payments.isPending || refunds.isPending;
  const failed = invoices.isError || payments.isError || refunds.isError;
  const collected = (payments.data?.data ?? []).filter((payment) => payment.status === 'SETTLED').reduce((totals, payment) => add(totals, payment.currencyCode, payment.amount), {} as Amounts);
  const refunded = (refunds.data?.data ?? []).reduce((totals, refund) => add(totals, refund.currencyCode, refund.amount), {} as Amounts);
  const invoiced = Object.fromEntries((invoices.data?.totals ?? []).map((total) => [total.currencyCode, Number(total.amount)]));

  function exportReport() {
    const lines = ['metric,currency,amount', ...Object.entries(invoiced).map(([currency, amount]) => `invoiced_ytd,${currency},${amount}`), ...Object.entries(collected).map(([currency, amount]) => `collected,${currency},${amount}`), ...Object.entries(refunded).map(([currency, amount]) => `refunded,${currency},${amount}`)];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    const link = document.createElement('a'); link.href = url; link.download = `revops-report-${invoices.data?.year ?? new Date().getFullYear()}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  return <div>
    <PageHeader title="Revenue reports" description="Current financial figures from finalized invoices, settled payments, and completed refunds." actions={<Button variant="outline" size="sm" disabled={loading || failed} onClick={exportReport} leftIcon={<Download className="h-3.5 w-3.5" />}>Export CSV</Button>} />
    <Tabs activeTab={activeTab} onChange={setActiveTab} tabs={[{ id: 'revenue', label: 'Revenue & cash' }, { id: 'subscriptions', label: 'Subscriptions' }, { id: 'aging', label: 'Receivables' }]} className="mb-6" />
    {failed && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Some report data could not be loaded. Refresh the page to retry.</div>}
    {loading && <p className="text-sm text-slate-600">Loading report data…</p>}
    {!loading && !failed && activeTab === 'revenue' && <div className="space-y-6"><div className="grid gap-4 md:grid-cols-3"><Metric label={`Finalized invoices (${invoices.data?.year ?? new Date().getFullYear()})`} amounts={invoiced} /><Metric label="Settled payments" amounts={collected} /><Metric label="Completed refunds" amounts={refunded} /></div><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs"><h2 className="font-semibold text-slate-900">Data definition</h2><p className="mt-1 text-sm leading-6 text-slate-600">Invoices are year-to-date finalized invoice totals. Settled payments and refunds reflect records currently available in this workspace. Amounts are never combined across currencies.</p></section></div>}
    {!loading && !failed && activeTab !== 'revenue' && <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs"><h2 className="font-semibold text-slate-900">Report unavailable</h2><p className="mt-2 text-sm leading-6 text-slate-600">This report needs additional server-side metrics before it can be shown accurately. It is intentionally not populated with sample values.</p></section>}
  </div>;
}
