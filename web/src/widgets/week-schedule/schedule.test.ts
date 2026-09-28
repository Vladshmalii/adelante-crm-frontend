import { describe, expect, it } from 'vitest';

import { defaultWeek, weekFromApi } from './schedule';

const empty = { isWorkDay: false, start: null, end: null, breakStart: null, breakEnd: null };

describe('weekFromApi', () => {
  it('несохранённый график → типовая неделя', () => {
    const week = Object.fromEntries(
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((d) => [
        d,
        empty,
      ]),
    );
    expect(weekFromApi(week)).toEqual(defaultWeek());
  });

  it('обрезает секунды у времени из API', () => {
    const week = weekFromApi({
      monday: {
        isWorkDay: true,
        start: '10:00:00',
        end: '19:30:00',
        breakStart: null,
        breakEnd: null,
      },
    });
    expect(week.monday).toEqual({
      isWorkDay: true,
      start: '10:00',
      end: '19:30',
      breakStart: null,
      breakEnd: null,
    });
  });
});
