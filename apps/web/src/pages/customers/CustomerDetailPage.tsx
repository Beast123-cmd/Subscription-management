import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building, Mail, Phone, MapPin, Edit, ArrowLeft, CreditCard, FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/data/StatusBadge';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/contexts/ToastContext';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const toast = useToast();

  const { data: customer, isLoading, isError, refetch } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => apiClient.getCustomer(id || ''),
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

  if (isError || !customer) {
    return (
      <ErrorState
        statusCode={404}
        title="Customer Not Found"
        message="The customer record does not exist in the active organization context."
        onBack={() => navigate('/app/customers')}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div>
      {/* Entity Header */}
      <PageHeader
        title={customer.displayName}
        description={`Legal Entity: ${customer.legalName}`}
        badge={<StatusBadge status={customer.status} />}
        breadcrumbs={[
          { label: 'Customers', href: '/app/customers' },
          { label: customer.customerNumber },
        ]}
        actions={
          <div className="flex items-center flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/customers')}
              leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => toast.info(`Edit ${customer.customerNumber}`, 'Edit Customer')}
              leftIcon={<Edit className="h-3.5 w-3.5" />}
            >
              Edit Customer
            </Button>
          </div>
        }
      />

      {/* Summary Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block">
            Business Number
          </span>
          <span className="text-base font-semibold text-slate-900 tabular-nums mt-1 block">
            {customer.customerNumber}
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block">
            Default Currency
          </span>
          <span className="text-base font-semibold text-slate-900 mt-1 block">
            {customer.defaultCurrencyCode}
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block">
            Tax Identifier (GSTIN/VAT)
          </span>
          <span className="text-base font-semibold text-slate-900 mt-1 block">
            {customer.taxIdentifier || 'Not Provided'}
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block">
            Customer Type
          </span>
          <span className="text-base font-semibold text-slate-900 mt-1 block">
            {customer.customerType}
          </span>
        </div>
      </div>

      {/* Detail Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'contacts', label: 'Contacts & Addresses' },
          { id: 'subscriptions', label: 'Subscriptions' },
          { id: 'invoices', label: 'Invoices & Billing' },
        ]}
        className="mb-5"
      />

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Account Details</h4>
            <dl className="divide-y divide-slate-100 text-xs">
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Legal Name</dt>
                <dd className="font-medium text-slate-900">{customer.legalName}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Display Name</dt>
                <dd className="font-medium text-slate-900">{customer.displayName}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Email</dt>
                <dd className="font-medium text-slate-900">{customer.email || '—'}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-medium text-slate-900">{customer.phone || '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Primary Contact & Address</h4>
            {customer.contacts && customer.contacts[0] ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-800 font-medium">
                  <Building className="h-4 w-4 text-slate-400" />
                  <span>{customer.contacts[0].firstName} {customer.contacts[0].lastName} ({customer.contacts[0].jobTitle})</span>
                </div>
                {customer.contacts[0].email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span>{customer.contacts[0].email}</span>
                  </div>
                )}
                {customer.contacts[0].phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{customer.contacts[0].phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No primary contact recorded.</p>
            )}

            {customer.addresses && customer.addresses[0] && (
              <div className="mt-4 pt-4 border-t border-slate-100 text-xs">
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-slate-800 block">Billing Address</span>
                    <span>{customer.addresses[0].addressLine1}, {customer.addresses[0].city} - {customer.addresses[0].postalCode}, {customer.addresses[0].countryCode}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h4 className="text-sm font-semibold text-slate-900 mb-4">Contacts & Address Records</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Multi-contact management and typed addresses (Billing/Shipping) per customer are fully supported in Phase 6.
          </p>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h4 className="text-sm font-semibold text-slate-900 mb-2">Active Subscriptions</h4>
          <p className="text-xs text-slate-500">Customer subscriptions enrolled under active plans.</p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/subscriptions')}
              leftIcon={<CreditCard className="h-3.5 w-3.5" />}
            >
              View Subscriptions Module
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h4 className="text-sm font-semibold text-slate-900 mb-2">Customer Invoices</h4>
          <p className="text-xs text-slate-500">Finalized, draft, and settled invoices for this account.</p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/invoices')}
              leftIcon={<FileText className="h-3.5 w-3.5" />}
            >
              View Invoices Module
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
