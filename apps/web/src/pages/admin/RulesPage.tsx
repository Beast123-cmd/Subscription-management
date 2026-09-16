import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';
import { useOrganization } from '@/contexts/OrgContext';
import { usePermission } from '@/contexts/PermissionContext';
import { useToast } from '@/contexts/ToastContext';

type Kind = 'taxes' | 'discounts';

export function RulesPage() {
  const { activeOrg } = useOrganization();
  const { can } = usePermission();
  const cache = useQueryClient();
  const toast = useToast();
  const [kind, setKind] = useState<Kind>('taxes');
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [saving, setSaving] = useState(false);
  const query = useQuery({ queryKey: ['rules', kind, activeOrg?.id], queryFn: () => apiClient.getRules(kind), enabled: Boolean(activeOrg) });
  const manage = can(kind === 'taxes' ? 'tax.manage' : 'discount.manage');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await apiClient.createRule(kind, { name, rate });
      setName(''); setRate('');
      await cache.invalidateQueries({ queryKey: ['rules', kind, activeOrg?.id] });
      toast.success(`${kind === 'taxes' ? 'Tax' : 'Discount'} rule created.`, 'Saved');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to save rule.', 'Rule failed'); }
    finally { setSaving(false); }
  }

  async function archive(id: string, ruleName: string) {
    if (!window.confirm(`Archive ${ruleName}? Existing invoice history is unchanged.`)) return;
    try {
      await apiClient.archiveRule(kind, id);
      await cache.invalidateQueries({ queryKey: ['rules', kind, activeOrg?.id] });
      toast.success(`${ruleName} archived.`, 'Saved');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to archive rule.', 'Rule failed'); }
  }

  const title = kind === 'taxes' ? 'Tax rules' : 'Discount rules';
  return <div>
    <PageHeader title="Taxes & Discounts" description="Percentage rules used when preparing draft invoices. Archived rules remain on historical documents." />
    <Tabs activeTab={kind} onChange={(value) => setKind(value as Kind)} className="mb-6" tabs={[{ id: 'taxes', label: 'Taxes' }, { id: 'discounts', label: 'Discounts' }]} />
    {manage && <form onSubmit={submit} className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs md:grid-cols-[1fr_180px_auto] md:items-end">
      <Input label={`${kind === 'taxes' ? 'Tax' : 'Discount'} name`} required value={name} onChange={(event) => setName(event.target.value)} placeholder={kind === 'taxes' ? 'GST' : 'Annual commitment'} />
      <Input label="Rate (%)" required inputMode="decimal" pattern="^(?:0|[1-9]\\d*)(?:\\.\\d{1,4})?$" value={rate} onChange={(event) => setRate(event.target.value)} placeholder="18" />
      <Button type="submit" isLoading={saving} leftIcon={<Plus className="h-4 w-4" />}>Add rule</Button>
    </form>}
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
      <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-600">Only active rules can be selected for new lines.</p></div>
      {query.isPending && <p className="p-5 text-sm text-slate-600">Loading rules…</p>}
      {query.isError && <div className="p-5 text-sm text-rose-700">Unable to load rules. <Button type="button" variant="link" onClick={() => query.refetch()}>Retry</Button></div>}
      {query.isSuccess && !query.data.data.length && <p className="p-5 text-sm text-slate-600">No {kind} rules yet.</p>}
      {query.data?.data.map((rule) => <div key={rule.id} className="flex items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 first:border-t-0"><div><p className="font-medium text-slate-900">{rule.name}</p><p className="mt-0.5 text-sm text-slate-600">{rule.rate}% · {rule.status.toLowerCase()}</p></div>{manage && rule.status === 'ACTIVE' && <Button type="button" variant="ghost" size="sm" onClick={() => void archive(rule.id, rule.name)} leftIcon={<Archive className="h-4 w-4" />}>Archive</Button>}</div>)}
    </section>
  </div>;
}
