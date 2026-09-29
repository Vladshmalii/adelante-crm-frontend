import { describe, expect, it } from 'vitest';

import {
  offHours,
  overlapsAny,
  placeOverlapping,
  shortBreaks,
  snapMove,
  visibleHours,
} from './layout';
import { formatClock, monthGrid, parseClock, weekDays } from './time';

const r = (start: number, end: number, item = `${start}`) => ({ start, end, item });

describe('раскладка сетки дня', () => {
  it('ставит пересекающиеся записи по дорожкам, независимые — во всю ширину', () => {
    const placed = placeOverlapping([r(600, 660, 'a'), r(615, 675, 'b'), r(700, 760, 'c')]);
    const byItem = Object.fromEntries(placed.map((p) => [p.item, p]));
    expect(byItem.a).toMatchObject({ lane: 0, lanes: 2 });
    expect(byItem.b).toMatchObject({ lane: 1, lanes: 2 });
    expect(byItem.c).toMatchObject({ lane: 0, lanes: 1 });
  });

  it('переиспользует освободившуюся дорожку внутри группы', () => {
    const placed = placeOverlapping([r(600, 720, 'long'), r(600, 630, 'x'), r(640, 700, 'y')]);
    const byItem = Object.fromEntries(placed.map((p) => [p.item, p]));
    expect(byItem.long?.lanes).toBe(2);
    expect(byItem.y?.lane).toBe(byItem.x?.lane);
  });

  it('находит перерывы до 15 минут', () => {
    expect(shortBreaks([r(600, 660), r(670, 700), r(760, 800)])).toEqual([
      { start: 660, end: 670 },
    ]);
  });

  it('считает нерабочее время вокруг окон графика', () => {
    expect(
      offHours(
        [
          { start: 540, end: 780 },
          { start: 840, end: 1080 },
        ],
        480,
        1200,
      ),
    ).toEqual([
      { start: 480, end: 540 },
      { start: 780, end: 840 },
      { start: 1080, end: 1200 },
    ]);
    expect(offHours([], 480, 1200)).toEqual([{ start: 480, end: 1200 }]);
  });

  it('расширяет видимые часы под поздние записи', () => {
    expect(visibleHours([])).toEqual({ start: 480, end: 1200 });
    expect(visibleHours([{ start: 450, end: 1290 }])).toEqual({ start: 420, end: 1320 });
  });

  it('привязывает перенос к шагу сетки', () => {
    // 2 px на минуту: 35 px вниз = 17,5 мин → при шаге 15 — к 15 минутам.
    expect(snapMove(600, 35, 2, 15)).toBe(615);
    expect(snapMove(600, -70, 2, 30)).toBe(570);
    expect(snapMove(10, -500, 2, 15)).toBe(0);
  });

  it('проверяет занятость', () => {
    expect(overlapsAny({ start: 600, end: 660 }, [{ start: 660, end: 700 }])).toBe(false);
    expect(overlapsAny({ start: 600, end: 661 }, [{ start: 660, end: 700 }])).toBe(true);
  });
});

describe('даты Розкладу', () => {
  it('неделя с понедельника', () => {
    expect(weekDays('2026-09-30')).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ]);
    expect(weekDays('2026-10-04')[0]).toBe('2026-09-28');
  });

  it('сетка месяца — 6 недель с понедельника', () => {
    expect(monthGrid('2026-09-15')).toEqual(['2026-08-31', '2026-10-11']);
  });

  it('часы и минуты', () => {
    expect(parseClock('09:30:00')).toBe(570);
    expect(formatClock(570)).toBe('09:30');
  });
});
