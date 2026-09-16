import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/data/StatusBadge';
import { useOrganization } from '@/contexts/OrgContext';

export function OrganizationSettingsPage() {
  const { activeOrg } = useOrganization();
  const values = [
    ['Organization name', activeOrg?.name ?? '—'],
    ['Tenant slug', activeOrg?.slug ?? '—'],
    ['Operating timezone', activeOrg?.timezone ?? '—'],
    ['Default currency', activeOrg?.defaultCurrencyCode ?? '—'],
  ];
  return <div><PageHeader title="Organization Settings" description="Current tenant configuration used by billing documents and reporting." badge={<StatusBadge status={activeOrg?.status} />} /><section className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xs"><dl className="divide-y divide-slate-100">{values.map(([label, value]) => <div key={label} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between"><dt className="text-sm text-slate-600">{label}</dt><dd className="font-medium text-slate-900">{value}</dd></div>)}</dl><p className="mt-5 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-600">Organization changes are intentionally read-only until an audited configuration-update API is available.</p></section></div>;
}
