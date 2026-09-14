import React from 'react';
import { Building, Globe, Clock, DollarSign, Save } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/data/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useOrganization } from '@/contexts/OrgContext';
import { useToast } from '@/contexts/ToastContext';

export function OrganizationSettingsPage() {
  const { activeOrg } = useOrganization();
  const toast = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Organization configuration saved.', 'Settings Updated');
  };

  return (
    <div>
      <PageHeader
        title="Organization Settings"
        description="Global tenant profile, operational timezone, and currency defaults."
        badge={<StatusBadge status={activeOrg?.status} />}
      />

      <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Organization Legal Name"
            defaultValue={activeOrg?.name}
            required
            helperText="Appears on issued invoices, receipts, and quotations."
          />

          <Input
            label="Tenant Slug"
            defaultValue={activeOrg?.slug}
            disabled
            helperText="Globally unique identifier in the platform."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Operating Timezone"
              defaultValue={activeOrg?.timezone || 'Asia/Kolkata'}
              options={[
                { label: 'Asia/Kolkata (IST)', value: 'Asia/Kolkata' },
                { label: 'America/New_York (EST)', value: 'America/New_York' },
                { label: 'Europe/London (GMT/BST)', value: 'Europe/London' },
                { label: 'Europe/Amsterdam (CET)', value: 'Europe/Amsterdam' },
                { label: 'Asia/Singapore (SGT)', value: 'Asia/Singapore' },
              ]}
            />

            <Select
              label="Default Currency"
              defaultValue={activeOrg?.defaultCurrencyCode || 'INR'}
              options={[
                { label: 'INR (₹ - Indian Rupee)', value: 'INR' },
                { label: 'USD ($ - US Dollar)', value: 'USD' },
                { label: 'EUR (€ - Euro)', value: 'EUR' },
                { label: 'GBP (£ - British Pound)', value: 'GBP' },
              ]}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button type="submit" variant="primary" size="sm" leftIcon={<Save className="h-3.5 w-3.5" />}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
