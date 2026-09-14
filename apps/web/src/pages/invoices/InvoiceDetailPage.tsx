import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCheck, Ban, DollarSign, Printer } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/data/StatusBadge';
import { CurrencyDisplay } from '@/components/data/CurrencyDisplay';
import { DateDisplay } from '@/components/data/DateDisplay';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { Can } from '@/components/auth/Can';
import { PERMISSIONS } from '@/lib/permissions';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/contexts/ToastContext';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: invoice, isLoading, isError, refetch } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => apiClient.getInvoice(id || ''),
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

  if (isError || !invoice) {
    return (
      <ErrorState
        statusCode={404}
        title="Invoice Not Found"
        message="The requested invoice does not exist in the active organization context."
        onBack={() => navigate('/app/invoices')}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={invoice.invoiceNumber}
        description={`Billed to ${invoice.customerName}`}
        badge={<StatusBadge status={invoice.status} />}
        breadcrumbs={[
          { label: 'Invoices', href: '/app/invoices' },
          { label: invoice.invoiceNumber },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/invoices')}
              leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
            >
              Back
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Printing invoice representation...', 'Print')}
              leftIcon={<Printer className="h-3.5 w-3.5" />}
            >
              Print
            </Button>

            <Can permission={PERMISSIONS.INVOICE_FINALIZE}>
              {invoice.status === 'DRAFT' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => toast.success(`Invoice ${invoice.invoiceNumber} finalized.`, 'Invoice Finalized')}
                  leftIcon={<CheckCheck className="h-3.5 w-3.5" />}
                >
                  Finalize Invoice
                </Button>
              )}
            </Can>

            <Can permission={PERMISSIONS.PAYMENT_CREATE}>
              {invoice.status !== 'PAID' && invoice.status !== 'VOID' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => toast.info(`Recording payment for ${invoice.invoiceNumber}`, 'Record Payment')}
                  leftIcon={<DollarSign className="h-3.5 w-3.5" />}
                >
                  Record Payment
                </Button>
              )}
            </Can>

            <Can permission={PERMISSIONS.INVOICE_VOID}>
              {invoice.status !== 'VOID' && invoice.status !== 'PAID' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => toast.warning(`Invoice ${invoice.invoiceNumber} voided.`, 'Invoice Voided')}
                  leftIcon={<Ban className="h-3.5 w-3.5" />}
                >
                  Void
                </Button>
              )}
            </Can>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Grand Total
          </span>
          <div className="mt-1">
            <CurrencyDisplay
              amount={invoice.grandTotal}
              currencyCode={invoice.currencyCode}
              className="text-lg font-bold"
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Amount Paid
          </span>
          <div className="mt-1">
            <CurrencyDisplay
              amount={invoice.amountPaid}
              currencyCode={invoice.currencyCode}
              className="text-base font-semibold text-emerald-600"
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Amount Due
          </span>
          <div className="mt-1">
            <CurrencyDisplay
              amount={invoice.amountDue}
              currencyCode={invoice.currencyCode}
              className={parseFloat(invoice.amountDue) > 0 ? 'text-base font-bold text-rose-600' : 'text-base text-slate-500'}
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Due Date
          </span>
          <span className="text-base font-semibold text-slate-900 mt-1 block">
            <DateDisplay date={invoice.dueDate} />
          </span>
        </div>
      </div>

      {/* Financial Document Panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-100 pb-5 mb-5 gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">{invoice.invoiceNumber}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued <DateDisplay date={invoice.issueDate} /> · Due <DateDisplay date={invoice.dueDate} />
            </p>
            {invoice.subscriptionNumber && (
              <p className="text-xs text-slate-500 mt-1">
                Linked Subscription: <span className="font-semibold text-slate-800">{invoice.subscriptionNumber}</span>
              </p>
            )}
          </div>
          <div className="sm:text-right">
            <span className="text-xs text-slate-400 block">Billed To</span>
            <span className="text-sm font-semibold text-slate-900 block">{invoice.customerName}</span>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-2.5">Description</th>
                <th className="py-2.5 text-center w-20">Qty</th>
                <th className="py-2.5 text-right w-32">Unit Price</th>
                <th className="py-2.5 text-right w-32">Tax (GST)</th>
                <th className="py-2.5 text-right w-36">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items?.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 font-medium text-slate-900">{item.description}</td>
                  <td className="py-3 text-center tabular-nums text-slate-700">{item.quantity}</td>
                  <td className="py-3 text-right">
                    <CurrencyDisplay amount={item.unitPrice} currencyCode={invoice.currencyCode} align="right" />
                  </td>
                  <td className="py-3 text-right">
                    <CurrencyDisplay amount={item.taxAmount} currencyCode={invoice.currencyCode} align="right" />
                  </td>
                  <td className="py-3 text-right font-semibold">
                    <CurrencyDisplay amount={item.lineTotal} currencyCode={invoice.currencyCode} align="right" />
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">No items available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <CurrencyDisplay amount={invoice.subtotal} currencyCode={invoice.currencyCode} align="right" />
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax Total:</span>
              <CurrencyDisplay amount={invoice.taxTotal} currencyCode={invoice.currencyCode} align="right" />
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-200 pt-2">
              <span>Grand Total:</span>
              <CurrencyDisplay amount={invoice.grandTotal} currencyCode={invoice.currencyCode} align="right" />
            </div>
            <div className="flex justify-between text-rose-600 font-semibold border-t border-slate-100 pt-1">
              <span>Amount Due:</span>
              <CurrencyDisplay amount={invoice.amountDue} currencyCode={invoice.currencyCode} align="right" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
