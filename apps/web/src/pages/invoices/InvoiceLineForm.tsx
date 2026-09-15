import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function InvoiceLineForm({ invoiceId, currencyCode }: { invoiceId: string; currencyCode: string }) {
  const cache = useQueryClient();
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  return <form className="mb-6 rounded-xl border border-indigo-200 bg-white p-6" onSubmit={async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError(''); setMessage('');
    try {
      await apiClient.addInvoiceLine(invoiceId, { description: description.trim(), quantity: Number(quantity), unitPrice });
      setDescription(''); setQuantity('1'); setUnitPrice(''); setMessage('Line saved to this draft.');
      await cache.invalidateQueries({ queryKey: ['invoice'] });
      await cache.invalidateQueries({ queryKey: ['invoices'] });
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to save the line.'); }
    finally { setSaving(false); }
  }}>
    <h2 className="text-lg font-semibold text-slate-900">Build your invoice</h2>
    <p className="mt-1 mb-5 text-sm text-slate-600">Add each service or item to the draft. Final totals are calculated when the invoice is finalized.</p>
    <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-4">
      <div className="sm:col-span-2"><Input label="Description" required maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="e.g. Monthly support" /></div>
      <Input label="Quantity" required type="number" min="1" max="2147483647" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
      <Input label={`Unit price (${currencyCode})`} required inputMode="decimal" pattern="(?:0|[1-9][0-9]*)(?:\.[0-9]{1,4})?" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} placeholder="0.00" />
    </fieldset>
    {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
    <p role="status" className="mt-3 text-sm text-emerald-700">{message}</p>
    <Button type="submit" className="mt-3" isLoading={saving}>Add line</Button>
  </form>;
}
