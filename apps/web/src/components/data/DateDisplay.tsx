import React from 'react';
import { formatBusinessDate, formatTimestamp, formatRelativeTime } from '@/lib/date';
import { useOrganization } from '@/contexts/OrgContext';
import { cn } from '@/lib/utils';

export interface DateDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  date: string | Date | null | undefined;
  mode?: 'date' | 'datetime' | 'relative';
  includeTimezone?: boolean;
}

export function DateDisplay({
  date,
  mode = 'date',
  includeTimezone = false,
  className,
  ...props
}: DateDisplayProps) {
  const { activeOrg } = useOrganization();
  const timezone = activeOrg?.timezone || 'Asia/Kolkata';

  let formatted = '—';
  if (mode === 'datetime') {
    formatted = formatTimestamp(date, timezone, includeTimezone);
  } else if (mode === 'relative') {
    formatted = formatRelativeTime(date);
  } else {
    formatted = formatBusinessDate(date, timezone);
  }

  return (
    <span className={cn('text-slate-700 whitespace-nowrap text-xs', className)} {...props}>
      {formatted}
    </span>
  );
}
