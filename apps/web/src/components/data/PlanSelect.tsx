import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useOrganization } from '@/contexts/OrgContext';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export function PlanSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { activeOrg } = useOrganization();
  const [search, setSearch] = useState('');
  const query = useQuery({
    queryKey: ['plan-options', activeOrg?.id],
    queryFn: () => apiClient.getPlans(),
    enabled: Boolean(activeOrg),
  });
  const plans = (query.data?.data ?? []).filter((plan) => plan.status === 'ACTIVE');
  const visible = plans.filter(
    (plan) =>
      plan.id === value ||
      `${plan.name} ${plan.planCode}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-2">
      <Input
        label="Find plan"
        placeholder="Name or plan code"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <Select
        label="Plan"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={query.isPending || query.isError}
        options={[
          { value: '', label: query.isPending ? 'Loading plans…' : 'Choose a plan' },
          ...visible.map((plan) => ({ value: plan.id, label: `${plan.name} · ${plan.planCode}` })),
        ]}
      />
      {query.isError && (
        <div role="alert" className="text-sm text-rose-700">
          Unable to load plans.{' '}
          <Button type="button" variant="link" onClick={() => query.refetch()}>
            Retry
          </Button>
        </div>
      )}
      {query.isSuccess && !visible.length && (
        <p className="text-sm text-slate-600">
          {plans.length ? 'No plans match your search.' : 'Create an active plan first from Plans.'}
        </p>
      )}
    </div>
  );
}
