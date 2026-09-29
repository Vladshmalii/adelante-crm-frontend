import dayjs, { type Dayjs } from 'dayjs';

import { ApiError, type Schema } from '@/shared/api';
import { inSalonTz } from '@/shared/lib';

type Cell = Schema<'ShiftCellOut'>;

export const todayInSalon = () => inSalonTz(new Date()).format('YYYY-MM-DD');

/** Понедельник недели, в которую попадает день. */
export const mondayOf = (date: string) => {
  const d = dayjs(date);
  return d.subtract((d.day() + 6) % 7, 'day').format('YYYY-MM-DD');
};

/** Дни сетки (включительно) начиная с `from`. */
export function periodDays(from: string, weeks: number): string[] {
  const start = dayjs(from);
  return Array.from({ length: weeks * 7 }, (_, i) => start.add(i, 'day').format('YYYY-MM-DD'));
}

/** В прошлом смены ставить и менять нельзя (сегодня — можно). */
export const isPast = (date: string) => date < todayInSalon();

/** `HH:MM:SS` → `HH:MM`. */
export const clock = (time: string | null | undefined) => (time ? time.slice(0, 5) : '');

/** Текст ячейки: «09:00–18:00» у смены; у отметки и выходного — пусто (их рисует тег). */
export const shiftText = (cell: Pick<Cell, 'kind' | 'start' | 'end'>) =>
  cell.kind === 'shift' ? `${clock(cell.start)}–${clock(cell.end)}` : '';

/** Подсказка к смене: перерыв и комментарий. */
export function shiftHint(cell: Cell): string | null {
  const parts: string[] = [];
  if (cell.breakStart && cell.breakEnd)
    parts.push(`Перерва ${clock(cell.breakStart)}–${clock(cell.breakEnd)}`);
  if (cell.comment) parts.push(cell.comment);
  return parts.length ? parts.join('. ') : null;
}

/** Время из TimePicker → `HH:mm` для API. */
export const toTime = (value: Dayjs | null | undefined) => (value ? value.format('HH:mm') : null);

/** `HH:MM[:SS]` → Dayjs для TimePicker. */
export const fromTime = (time: string | null | undefined) =>
  time ? dayjs(`2000-01-01T${time.slice(0, 5)}`) : null;

export type CellKind = Schema<'ShiftKind'> | 'off';

export interface CellFormValues {
  kind: CellKind;
  hours?: [Dayjs, Dayjs] | null;
  breakHours?: [Dayjs, Dayjs] | null;
  comment?: string;
}

/**
 * Значения формы ячейки → тело `PUT /shifts/{staffId}/{date}`; `null` — выходной (`DELETE`).
 * У отметки время не отправляем — бекенд его игнорирует.
 */
export function cellBody(v: CellFormValues): Schema<'ShiftIn'> | null {
  if (v.kind === 'off') return null;
  const comment = v.comment?.trim() ? v.comment.trim() : null;
  if (v.kind !== 'shift') return { kind: v.kind, comment };
  return {
    kind: 'shift',
    start: toTime(v.hours?.[0]),
    end: toTime(v.hours?.[1]),
    breakStart: toTime(v.breakHours?.[0]),
    breakEnd: toTime(v.breakHours?.[1]),
    comment,
  };
}

/** Ячейка API → значения формы. */
export const cellValues = (cell: Cell): CellFormValues => {
  const start = fromTime(cell.start);
  const end = fromTime(cell.end);
  const breakStart = fromTime(cell.breakStart);
  const breakEnd = fromTime(cell.breakEnd);
  return {
    kind: cell.kind ?? 'off',
    hours: start && end ? [start, end] : null,
    breakHours: breakStart && breakEnd ? [breakStart, breakEnd] : null,
    comment: cell.comment ?? undefined,
  };
};

/**
 * Часы, недоступные в выборе времени: вне часов салона в этот день. Бекенд проверит точно,
 * здесь — подсказка на уровне часов.
 */
export function hoursOutside(open: string | null, close: string | null): number[] {
  if (!open || !close) return [];
  const from = Number(open.slice(0, 2));
  const to = Number(close.slice(0, 2)) + (close.slice(3, 5) === '00' ? 0 : 1);
  return Array.from({ length: 24 }, (_, h) => h).filter((h) => h < from || h > to);
}

/**
 * Ошибки 422 по полям смены → поля формы ячейки: время смены и перерыв. Бекенд называет поля
 * `start` / `end` / `breakStart` / `breakEnd` (или в snake_case).
 */
export function shiftFieldErrors(
  error: unknown,
): { name: 'hours' | 'breakHours'; errors: string[] }[] {
  if (!(error instanceof ApiError) || error.status !== 422 || !error.details) return [];
  const byField: Record<'hours' | 'breakHours', string[]> = { hours: [], breakHours: [] };
  for (const [key, value] of Object.entries(error.details)) {
    if (!Array.isArray(value)) continue;
    const texts = value.filter((v): v is string => typeof v === 'string');
    const field = /break/i.test(key) ? 'breakHours' : /^(start|end)$/i.test(key) ? 'hours' : null;
    if (field) byField[field].push(...texts);
  }
  return (['hours', 'breakHours'] as const)
    .filter((name) => byField[name].length > 0)
    .map((name) => ({ name, errors: byField[name] }));
}
