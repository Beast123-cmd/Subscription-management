export interface FormatCurrencyOptions {
  showCode?: boolean;
  locale?: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SGD: 'S$',
  AED: 'AED',
  CAD: 'CA$',
  AUD: 'AU$',
};

export function getCurrencySymbol(currencyCode: string): string {
  const code = (currencyCode || '').toUpperCase().trim();
  return CURRENCY_SYMBOLS[code] || code;
}

/**
 * Formats a decimal string or number with proper thousands separators,
 * 2 decimal places, currency symbol, and optional ISO code.
 * Example: formatCurrency("84500.00", "INR") => "₹84,500.00 INR"
 */
export function formatCurrency(
  value: string | number | null | undefined,
  currencyCode = 'INR',
  options: FormatCurrencyOptions = { showCode: true }
): string {
  if (value === null || value === undefined || value === '') {
    return `— ${currencyCode}`;
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) {
    return `— ${currencyCode}`;
  }

  const symbol = getCurrencySymbol(currencyCode);
  const formattedNumber = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  if (options.showCode) {
    return `${symbol}${formattedNumber} ${currencyCode}`;
  }

  return `${symbol}${formattedNumber}`;
}
