import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, RotateCcw, Receipt } from 'lucide-react';
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

export function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: payment, isLoading, isError, refetch } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => apiClient.getPayment(id || ''),
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

  if (isError || !payment) {
    return (
      <ErrorState
        statusCode={404}
        title="Payment Not Found"
        message="The requested payment does not exist in the active organization context."
        onBack={() => navigate('/app/payments')}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={payment.paymentNumber}
        description={`Applied to invoice ${payment.invoiceNumber} (${payment.customerName})`}
        badge={<StatusBadge status={payment.status} />}
        breadcrumbs={[
          { label: 'Payments', href: '/app/payments' },
          { label: payment.paymentNumber },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/payments')}
              leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
            >
              Back
            </Button>
            <Can permission={PERMISSIONS.PAYMENT_REFUND}>
              {payment.status === 'SETTLED' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.warning('Refund workflow will execute in Phase 12.', 'Issue Refund')}
                  leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                >
                  Issue Refund
                </Button>
              )}
            </Can>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Payment Amount
          </span>
          <div className="mt-1">
            <CurrencyDisplay
              amount={payment.amount}
              currencyCode={payment.currencyCode}
              className="text-lg font-bold text-emerald-700"
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Settlement Date
          </span>
          <span className="text-base font-semibold text-slate-900 mt-1 block">
            <DateDisplay date={payment.paymentDate} />
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Payment Method
          </span>
          <span className="text-base font-semibold text-slate-900 mt-1 block">
            {payment.paymentMethod.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Reference / UTR
          </span>
          <span className="text-base font-semibold text-slate-900 mt-1 block font-mono text-xs">
            {payment.referenceNumber || 'N/A'}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Settlement Record</h4>
        <dl className="divide-y divide-slate-100 text-xs">
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Invoice Number</dt>
            <dd className="font-semibold text-slate-900 tabular-nums">{payment.invoiceNumber}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Customer</dt>
            <dd className="font-semibold text-slate-900">{payment.customerName}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Recorded In System</dt>
            <dd className="font-semibold text-slate-900"><DateDisplay date={payment.createdAt} mode="datetime" /></dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
