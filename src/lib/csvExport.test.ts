import { describe, it, expect } from 'vitest';
import { csvDateStamp } from './csvExport';

describe('csvDateStamp', () => {
  it('returns YYYY-MM-DD format', () => {
    const stamp = csvDateStamp();
    expect(stamp).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('uses zero-padded month and day', () => {
    const stamp = csvDateStamp();
    const [, month, day] = stamp.split('-');
    expect(month).toHaveLength(2);
    expect(day).toHaveLength(2);
  });

  it('matches todays date', () => {
    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(csvDateStamp()).toBe(expected);
  });
});
