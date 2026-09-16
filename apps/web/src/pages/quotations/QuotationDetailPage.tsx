import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, Send, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/data/StatusBadge';
import { CurrencyDisplay } from '@/components/data/CurrencyDisplay';
import { DateDisplay } from '@/components/data/DateDisplay';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { apiClient } from '@/lib/api-client';
import { useCommand } from '@/lib/use-command';
import { PlanSelect } from '@/components/data/PlanSelect';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';

export function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { run, pending } = useCommand();
  const toast = useToast();
  const [convertOpen, setConvertOpen] = React.useState(false);
  const [planId, setPlanId] = React.useState('');
  const [startDate, setStartDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [converting, setConverting] = React.useState(false);
  async function convert() { if (!id || converting) return; setConverting(true); try { const subscription = await apiClient.convertQuotation(id, { planId, startDate, billingStartDate: startDate }); toast.success(`${subscription.subscriptionNumber} created from this quotation.`, 'Subscription created'); navigate(`/app/subscriptions/${subscription.id}`); } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to create subscription.', 'Conversion failed'); } finally { setConverting(false); } }

  const { data: quotation, isLoading, isError, refetch } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => apiClient.getQuotation(id || ''),
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

  if (isError || !quotation) {
    return (
      <ErrorState
        statusCode={404}
        title="Quotation Not Found"
        message="The requested quotation does not exist in the active organization context."
        onBack={() => navigate('/app/quotations')}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={quotation.quotationNumber}
        description={`Commercial quotation for ${quotation.customerName}`}
        badge={<StatusBadge status={quotation.status} />}
        breadcrumbs={[
          { label: 'Quotations', href: '/app/quotations' },
          { label: quotation.quotationNumber },
        ]}
        actions={
          <div className="flex items-center flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/quotations')}
              leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
            >
              Back
            </Button>
            {quotation.status === 'DRAFT' && (
              <Button variant="primary" size="sm" isLoading={pending} onClick={() => void run(`/quotations/${quotation.id}/issue`, `Quotation ${quotation.quotationNumber} issued.`)} leftIcon={<Send className="h-3.5 w-3.5" />}>Issue quotation</Button>
            )}
            {quotation.status === 'ISSUED' && (
              <Button
                variant="primary"
                size="sm"
                isLoading={pending}
                onClick={() => void run(`/quotations/${quotation.id}/accept`, `Quotation ${quotation.quotationNumber} accepted.`, 'Accept this quotation?')}
                leftIcon={<CheckCircle className="h-3.5 w-3.5" />}
              >
                Accept & Convert
              </Button>
            )}
            {quotation.status === 'ACCEPTED' && <Button variant="primary" size="sm" onClick={() => setConvertOpen((value) => !value)} leftIcon={<CheckCircle className="h-3.5 w-3.5" />}>Create subscription</Button>}
            {['DRAFT', 'ISSUED'].includes(quotation.status) && <Button variant="destructive" size="sm" isLoading={pending} onClick={() => void run(`/quotations/${quotation.id}/cancel`, `Quotation ${quotation.quotationNumber} cancelled.`, 'Cancel this quotation?')} leftIcon={<XCircle className="h-3.5 w-3.5" />}>Cancel</Button>}
          </div>
        }
      />

      {quotation.status === 'ACCEPTED' && convertOpen && <section className="mb-6 rounded-xl border border-indigo-200 bg-white p-5 shadow-2xs"><h2 className="font-semibold text-slate-900">Create subscription from accepted quotation</h2><p className="mt-1 text-sm text-slate-600">The negotiated quotation lines will be snapshotted into a new draft subscription.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><PlanSelect value={planId} onChange={setPlanId} /><Input label="Subscription start date" type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div><div className="mt-4 flex gap-2"><Button type="button" isLoading={converting} disabled={!planId} onClick={() => void convert()}>Create draft subscription</Button><Button type="button" variant="secondary" disabled={converting} onClick={() => setConvertOpen(false)}>Cancel</Button></div></section>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block">
            Quotation Value
          </span>
          <div className="mt-1">
            <CurrencyDisplay
              amount={quotation.grandTotal}
              currencyCode={quotation.currencyCode}
              className="text-lg font-bold"
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block">
            Valid Until
          </span>
          <span className="text-base font-semibold text-slate-900 mt-1 block">
            <DateDisplay date={quotation.validUntil} />
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block">
            Issue Date
          </span>
          <span className="text-base font-semibold text-slate-900 mt-1 block">
            <DateDisplay date={quotation.issueDate} />
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block">
            Status
          </span>
          <div className="mt-1.5">
            <StatusBadge status={quotation.status} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Quotation Overview</h4>
        <dl className="divide-y divide-slate-100 text-xs">
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Customer</dt>
            <dd className="font-semibold text-slate-900">{quotation.customerName}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Subtotal</dt>
            <dd className="font-semibold text-slate-900">
              <CurrencyDisplay amount={quotation.subtotal} currencyCode={quotation.currencyCode} />
            </dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Grand Total</dt>
            <dd className="font-semibold text-slate-900">
              <CurrencyDisplay amount={quotation.grandTotal} currencyCode={quotation.currencyCode} />
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
