import { describe, expect, it } from 'vitest';
import {
  compareDateStrings,
  formatLocalDate,
  formatLocalMonth,
  getCurrentLocalMonth,
  getLocalDateString,
  parseLocalDate,
} from './dateUtils';

describe('dateUtils', () => {
  it('parses YYYY-MM-DD as a local calendar date', () => {
    const date = parseLocalDate('2026-04-01');

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(3);
    expect(date.getDate()).toBe(1);
    expect(formatLocalDate('2026-04-01', { month: 'long', day: 'numeric', year: 'numeric' })).toBe('April 1, 2026');
  });

  it('formats YYYY-MM months without timezone drift', () => {
    expect(formatLocalMonth('2026-04', { month: 'long', year: 'numeric' })).toBe('April 2026');
  });

  it('builds local date and month strings from Date objects', () => {
    const date = new Date(2026, 3, 1, 23, 30);

    expect(getLocalDateString(date)).toBe('2026-04-01');
    expect(getCurrentLocalMonth(date)).toBe('2026-04');
  });

  it('sorts ISO calendar dates lexically', () => {
    expect(['2026-03-31', '2026-04-01'].sort(compareDateStrings)).toEqual([
      '2026-03-31',
      '2026-04-01',
    ]);
  });
});
