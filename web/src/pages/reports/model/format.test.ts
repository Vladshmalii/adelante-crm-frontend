import { describe, expect, it } from 'vitest';

import { formatChange, periodLabel } from './format';

describe('форматирование отчётов', () => {
  it('подписывает период по группировке', () => {
    expect(periodLabel('2026-09-28', 'day')).toBe('28.09');
    expect(periodLabel('2026-09-22', 'week')).toBe('22.09');
  });

  it('показывает изменение со знаком', () => {
    expect(formatChange(12.5)).toBe('+12,5%');
    expect(formatChange(-3)).toBe('−3%');
    expect(formatChange(0)).toBe('0%');
    expect(formatChange(null)).toBeNull();
  });
});
