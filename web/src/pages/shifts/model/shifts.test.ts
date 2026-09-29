import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api';

import {
  cellBody,
  cellValues,
  hoursOutside,
  mondayOf,
  periodDays,
  shiftFieldErrors,
  shiftHint,
  shiftText,
} from './shifts';

const t = (hhmm: string) => dayjs(`2000-01-01T${hhmm}`);

describe('сетка смен', () => {
  it('период: понедельник и дни недель', () => {
    expect(mondayOf('2026-10-01')).toBe('2026-09-28');
    const days = periodDays('2026-09-28', 2);
    expect(days).toHaveLength(14);
    expect(days[13]).toBe('2026-10-11');
  });

  it('текст и подсказка ячейки', () => {
    const cell = {
      date: '2026-10-05',
      kind: 'shift' as const,
      start: '09:00:00',
      end: '18:00:00',
      breakStart: '13:00:00',
      breakEnd: '14:00:00',
      comment: 'Навчання зранку',
      recordsCount: 0,
    };
    expect(shiftText(cell)).toBe('09:00–18:00');
    expect(shiftHint(cell)).toBe('Перерва 13:00–14:00. Навчання зранку');
    expect(shiftText({ kind: 'vacation', start: null, end: null })).toBe('');
  });

  it('тело запроса: смена, отметка, выходной', () => {
    expect(cellBody({ kind: 'shift', hours: [t('09:00'), t('18:00')], comment: ' ' })).toEqual({
      kind: 'shift',
      start: '09:00',
      end: '18:00',
      breakStart: null,
      breakEnd: null,
      comment: null,
    });
    expect(
      cellBody({ kind: 'sick', hours: [t('09:00'), t('18:00')], comment: 'До 14.10' }),
    ).toEqual({
      kind: 'sick',
      comment: 'До 14.10',
    });
    expect(cellBody({ kind: 'off' })).toBeNull();
  });

  it('ячейка → форма', () => {
    const v = cellValues({
      date: '2026-10-05',
      kind: null,
      recordsCount: 0,
    });
    expect(v.kind).toBe('off');
    expect(v.hours).toBeNull();
  });

  it('часы вне работы салона', () => {
    expect(hoursOutside('09:00:00', '20:00:00')).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 21, 22, 23]);
    expect(hoursOutside('08:30:00', '19:30:00')).toContain(21);
    expect(hoursOutside(null, null)).toEqual([]);
  });
});

describe('ошибки полей смены', () => {
  it('раскладывает details 422 по полям формы', () => {
    const error = new ApiError(422, {
      message: 'Некоректні поля',
      details: { end: ['Кінець раніше початку'], break_start: ['Перерва поза зміною'] },
    });
    expect(shiftFieldErrors(error)).toEqual([
      { name: 'hours', errors: ['Кінець раніше початку'] },
      { name: 'breakHours', errors: ['Перерва поза зміною'] },
    ]);
  });

  it('другие ошибки не трогает', () => {
    expect(shiftFieldErrors(new ApiError(409, { message: 'x', code: 'has_records' }))).toEqual([]);
  });
});
