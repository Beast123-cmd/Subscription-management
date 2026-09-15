import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useOrganization } from '@/contexts/OrgContext';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export function CustomerSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { activeOrg } = useOrganization();
  const [search, setSearch] = useState('');
  const query = useQuery({
    queryKey: ['customer-options', activeOrg?.id],
    queryFn: () => apiClient.getCustomers(),
    enabled: Boolean(activeOrg),
  });
  const customers = (query.data?.data ?? []).filter((customer) => customer.status === 'ACTIVE');
  const visible = customers.filter(
    (customer) =>
      customer.id === value ||
      `${customer.displayName} ${customer.customerNumber} ${customer.email ?? ''}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-2">
      <Input
        label="Find customer"
        placeholder="Name, email or customer number"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <Select
        label="Customer"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={query.isPending || query.isError}
        options={[
          { value: '', label: query.isPending ? 'Loading customers…' : 'Choose a customer' },
          ...visible.map((customer) => ({
            value: customer.id,
            label: `${customer.displayName} · ${customer.customerNumber}`,
          })),
        ]}
      />
      {query.isError && (
        <div role="alert" className="text-sm text-rose-700">
          Unable to load customers.{' '}
          <Button type="button" variant="link" onClick={() => query.refetch()}>
            Retry
          </Button>
        </div>
      )}
      {query.isSuccess && !visible.length && (
        <p className="text-sm text-slate-600">
          {customers.length
            ? 'No customers match your search.'
            : 'Create an active customer first from Customers.'}
        </p>
      )}
    </div>
  );
}
