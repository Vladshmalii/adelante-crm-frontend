import { describe, expect, it } from 'vitest';

import { dayLoad } from './load';

const day = (total: number, bookedMinutes: number, workMinutes: number) => ({
  date: '2026-09-28',
  total,
  bookedMinutes,
  workMinutes,
  byMaster: [],
});

describe('загрузка дня в мини-календаре', () => {
  it('доля занятого рабочего времени', () => {
    expect(dayLoad(day(3, 240, 960))).toBe(0.25);
    expect(dayLoad(day(9, 1200, 960))).toBe(1);
  });
  it('нет кольца у пустого и нерабочего дня', () => {
    expect(dayLoad(day(0, 0, 960))).toBeNull();
    expect(dayLoad(day(2, 60, 0))).toBeNull();
    expect(dayLoad(undefined)).toBeNull();
  });
});
