import React from 'react';
import { formatCurrency } from '@/lib/currency';
import { useOrganization } from '@/contexts/OrgContext';
import { cn } from '@/lib/utils';

export interface CurrencyDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: string | number | null | undefined;
  currencyCode?: string;
  showCode?: boolean;
  align?: 'left' | 'right' | 'inherit';
}

export function CurrencyDisplay({
  amount,
  currencyCode,
  showCode = true,
  align = 'inherit',
  className,
  ...props
}: CurrencyDisplayProps) {
  const { activeOrg } = useOrganization();
  const effectiveCurrency = currencyCode || activeOrg?.defaultCurrencyCode || 'INR';

  const formatted = formatCurrency(amount, effectiveCurrency, { showCode });

  const alignStyles = {
    left: 'text-left inline-block',
    right: 'text-right inline-block',
    inherit: '',
  }[align];

  return (
    <span
      className={cn('tabular-nums font-medium text-slate-900 tracking-tight', alignStyles, className)}
      {...props}
    >
      {formatted}
    </span>
  );
}
