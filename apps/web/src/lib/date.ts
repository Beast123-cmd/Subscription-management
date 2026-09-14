/**
 * Date/Time utilities adhering to organization timezone context.
 */

export const DEFAULT_ORG_TIMEZONE = 'Asia/Kolkata';

export function formatBusinessDate(
  dateValue: string | Date | null | undefined,
  timeZone = DEFAULT_ORG_TIMEZONE
): string {
  if (!dateValue) return '—';

  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: timeZone || DEFAULT_ORG_TIMEZONE,
    }).format(date);
  } catch {
    return '—';
  }
}

export function formatTimestamp(
  dateValue: string | Date | null | undefined,
  timeZone = DEFAULT_ORG_TIMEZONE,
  includeTimezone = false
): string {
  if (!dateValue) return '—';

  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return '—';

    const formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: timeZone || DEFAULT_ORG_TIMEZONE,
    }).format(date);

    const formattedTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timeZone || DEFAULT_ORG_TIMEZONE,
    }).format(date);

    if (includeTimezone) {
      return `${formattedDate} · ${formattedTime} (${timeZone})`;
    }

    return `${formattedDate} · ${formattedTime}`;
  } catch {
    return '—';
  }
}

export function formatRelativeTime(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return '—';
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    const diffMs = Date.now() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 30) return formatBusinessDate(date);
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'just now';
  } catch {
    return '—';
  }
}
