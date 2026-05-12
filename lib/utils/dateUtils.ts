export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentLocalMonth(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function parseLocalDate(value: string): Date {
  const [year = '0', month = '1', day = '1'] = value.split('-');
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function parseLocalMonth(value: string): Date {
  const [year = '0', month = '1'] = value.split('-');
  return new Date(Number(year), Number(month) - 1, 1);
}

export function formatLocalDate(
  value: string,
  options?: Intl.DateTimeFormatOptions,
  locale = 'en-US'
): string {
  return parseLocalDate(value).toLocaleDateString(locale, options);
}

export function formatLocalMonth(
  value: string,
  options?: Intl.DateTimeFormatOptions,
  locale = 'en-US'
): string {
  return parseLocalMonth(value).toLocaleDateString(locale, options);
}

export function compareDateStrings(a: string, b: string): number {
  return a.localeCompare(b);
}
