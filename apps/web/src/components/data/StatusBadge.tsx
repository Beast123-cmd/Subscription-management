import React from 'react';
import { Badge } from '@/components/ui/badge';

export interface StatusBadgeProps {
  status: string | null | undefined;
  size?: 'sm' | 'md';
  className?: string;
}

type BadgeVariant = 'success' | 'warning' | 'destructive' | 'info' | 'neutral' | 'outline';

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  if (!status) return null;

  const upper = status.toUpperCase().trim();

  let variant: BadgeVariant = 'neutral';
  const label = status.replace(/_/g, ' ');

  switch (upper) {
    // Success / Active
    case 'ACTIVE':
    case 'PAID':
    case 'SETTLED':
    case 'ACCEPTED':
    case 'CONFIRMED':
      variant = 'success';
      break;

    // Warning / Pending / Attention
    case 'PENDING':
    case 'PARTIALLY_PAID':
    case 'PARTIALLY_REFUNDED':
    case 'ISSUED':
    case 'PAUSED':
      variant = 'warning';
      break;

    // Destructive / Overdue / Terminated
    case 'OVERDUE':
    case 'CANCELLED':
    case 'REJECTED':
    case 'FAILED':
    case 'SUSPENDED':
    case 'VOID':
      variant = 'destructive';
      break;

    // Informational / Transition
    case 'FINALIZED':
    case 'PROCESSING':
      variant = 'info';
      break;

    // Neutral / Inactive / Historical
    case 'DRAFT':
    case 'ARCHIVED':
    case 'CLOSED':
    case 'EXPIRED':
    case 'REVOKED':
    default:
      variant = 'neutral';
      break;
  }

  return (
    <Badge variant={variant} size={size} dot className={className}>
      {label}
    </Badge>
  );
}
