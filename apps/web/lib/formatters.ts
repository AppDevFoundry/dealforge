/**
 * Formatting utilities for currency, percentages, and numbers
 */

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const currencyFormatterWithCents = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format a number as USD currency (e.g., $200,000)
 */
export function formatCurrency(value: number, includeCents = false): string {
  if (!Number.isFinite(value)) return '$0';
  return includeCents ? currencyFormatterWithCents.format(value) : currencyFormatter.format(value);
}

/**
 * Format a number as a percentage (e.g., 8.5%)
 */
export function formatPercentage(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a number with commas (e.g., 1,234,567)
 */
export function formatNumber(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return '0';
  if (decimals === 0) {
    return numberFormatter.format(Math.round(value));
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a ratio (e.g., 1.25x)
 */
export function formatRatio(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '0.00x';
  return `${value.toFixed(decimals)}x`;
}
