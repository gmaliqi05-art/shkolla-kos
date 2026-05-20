import { describe, it, expect } from 'vitest';
import { formatDate, formatRelative, toDateString } from './formatDate';

describe('formatDate', () => {
  it('returns empty string for null/undefined input', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('');
  });

  it('formats valid Date object', () => {
    const d = new Date('2026-05-20T10:00:00Z');
    const result = formatDate(d);
    expect(result).not.toBe('');
    expect(result.length).toBeGreaterThan(0);
  });

  it('formats valid date string', () => {
    const result = formatDate('2026-05-20');
    expect(result).not.toBe('');
  });
});

describe('formatRelative', () => {
  it('returns "Sot" for today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(formatRelative(today)).toBe('Sot');
  });

  it('returns "Dje" for yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    expect(formatRelative(yesterday)).toBe('Dje');
  });

  it('returns formatted date for older dates', () => {
    const oldDate = '2020-01-15';
    const result = formatRelative(oldDate);
    expect(result).not.toBe('Sot');
    expect(result).not.toBe('Dje');
    expect(result).not.toBe('');
  });

  it('returns empty for invalid input', () => {
    expect(formatRelative(null)).toBe('');
  });
});

describe('toDateString', () => {
  it('returns YYYY-MM-DD format', () => {
    const d = new Date('2026-05-20T10:00:00Z');
    expect(toDateString(d)).toBe('2026-05-20');
  });

  it('handles string input', () => {
    expect(toDateString('2026-05-20T15:30:00Z')).toBe('2026-05-20');
  });

  it('returns empty for null', () => {
    expect(toDateString(null)).toBe('');
  });
});
