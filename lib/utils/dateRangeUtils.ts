/**
 * Date Range Utilities for Analytics
 * Handles date range calculations, validation, and formatting for analytics features
 */

export { getCurrentMonth } from './monthUtils';
import { getCurrentMonth, getPreviousMonth, getNextMonth } from './monthUtils';

/**
 * Get all months within a date range (inclusive)
 * @param startMonth - Start month in YYYY-MM format
 * @param endMonth - End month in YYYY-MM format
 * @returns Array of months in YYYY-MM format
 */
export function getMonthsInRange(startMonth: string, endMonth: string): string[] {
  const months: string[] = [];
  let current = startMonth;

  while (current <= endMonth) {
    months.push(current);
    current = getNextMonth(current);
  }

  return months;
}

/**
 * Get preset date range based on preset name
 * @param preset - Preset type: '3months', '6months', '12months'
 * @returns Object with start and end months
 */
export function getPresetRange(
  preset: '3months' | '6months' | '12months'
): { start: string; end: string } {
  const currentMonth = getCurrentMonth();
  let start = currentMonth;

  switch (preset) {
    case '3months':
      start = getPreviousMonth(getPreviousMonth(currentMonth));
      break;
    case '6months':
      start = getPreviousMonth(
        getPreviousMonth(getPreviousMonth(getPreviousMonth(getPreviousMonth(currentMonth))))
      );
      break;
    case '12months':
      // Go back 11 months from current (so we have 12 months total)
      for (let i = 0; i < 11; i++) {
        start = getPreviousMonth(start);
      }
      break;
  }

  return {
    start,
    end: currentMonth,
  };
}

/**
 * Validate that a date range is valid
 * @param start - Start month in YYYY-MM format
 * @param end - End month in YYYY-MM format
 * @returns true if valid, false otherwise
 */
export function validateDateRange(start: string, end: string): boolean {
  // Check format
  if (!/^\d{4}-\d{2}$/.test(start) || !/^\d{4}-\d{2}$/.test(end)) {
    return false;
  }

  // Check that start <= end (after automatic swap, this is always true)
  return start <= end;
}

/**
 * Normalize a date range by swapping if start > end
 * @param start - Start month in YYYY-MM format
 * @param end - End month in YYYY-MM format
 * @returns Normalized range with start <= end
 */
export function normalizeDateRange(
  start: string,
  end: string
): { start: string; end: string } {
  if (start > end) {
    return { start: end, end: start };
  }
  return { start, end };
}

/**
 * Format a date range for display
 * @param start - Start month in YYYY-MM format
 * @param end - End month in YYYY-MM format
 * @returns Formatted string like "January 2025 - March 2025"
 */
export function formatMonthRange(start: string, end: string): string {
  const formatMonth = (month: string): string => {
    const [year, monthNum] = month.split('-');
    const date = new Date(`${month}-01`);
    const monthName = date.toLocaleDateString('en-US', { month: 'long' });
    return `${monthName} ${year}`;
  };

  return `${formatMonth(start)} - ${formatMonth(end)}`;
}

/**
 * Get the number of months in a date range
 * @param start - Start month in YYYY-MM format
 * @param end - End month in YYYY-MM format
 * @returns Number of months (inclusive)
 */
export function getMonthCount(start: string, end: string): number {
  const months = getMonthsInRange(start, end);
  return months.length;
}

/**
 * Check if a date range spans more than a year
 * @param start - Start month in YYYY-MM format
 * @param end - End month in YYYY-MM format
 * @returns true if more than 12 months, false otherwise
 */
export function isLargeRange(start: string, end: string): boolean {
  return getMonthCount(start, end) > 12;
}

/**
 * Check if a date range contains insufficient data for trend analysis
 * (Need at least 2 months for meaningful trends)
 * @param start - Start month in YYYY-MM format
 * @param end - End month in YYYY-MM format
 * @returns true if range has at least 2 months, false otherwise
 */
export function hasEnoughDataForTrends(start: string, end: string): boolean {
  return getMonthCount(start, end) >= 2;
}

/**
 * Get the previous full month (doesn't include partial current month)
 * @returns Month in YYYY-MM format
 */
export function getPreviousFullMonth(): string {
  return getPreviousMonth(getCurrentMonth());
}

/**
 * Check if a specific month is within a date range
 * @param month - Month to check in YYYY-MM format
 * @param start - Start of range in YYYY-MM format
 * @param end - End of range in YYYY-MM format
 * @returns true if month is within range, false otherwise
 */
export function isMonthInRange(start: string, end: string, month: string): boolean {
  return month >= start && month <= end;
}
