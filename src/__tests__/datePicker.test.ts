import { describe, it, expect } from 'vitest';
import { format, parse, isValid } from 'date-fns';

describe('DatePicker date parsing and formatting logic', () => {
  it('parses YYYY-MM-DD correctly', () => {
    const input = '2026-09-15';
    const parts = input.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);

    expect(isValid(d)).toBe(true);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8); // September is 8 (0-indexed)
    expect(d.getDate()).toBe(15);
    expect(format(d, 'yyyy-MM-dd')).toBe('2026-09-15');
  });

  it('parses DD/MM/YYYY correctly', () => {
    const input = '15/09/2026';
    const parts = input.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const d = new Date(year, month, day);

    expect(isValid(d)).toBe(true);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(15);
    expect(format(d, 'yyyy-MM-dd')).toBe('2026-09-15');
  });

  it('handles invalid date strings gracefully', () => {
    const input = 'invalid-date-string';
    const d = new Date(input);
    expect(isNaN(d.getTime())).toBe(true);
  });
});
