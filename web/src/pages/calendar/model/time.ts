import dayjs, { type Dayjs } from 'dayjs';

import { inSalonTz, SALON_TZ } from '@/shared/lib';

import type { CalendarView } from './search';

/** Сегодня в поясе салона, `YYYY-MM-DD`. */
export const todayInSalon = () => inSalonTz(new Date()).format('YYYY-MM-DD');

/** День `YYYY-MM-DD` как Dayjs (календарная дата, без пересчёта зоны). */
export const asDay = (date: string) => dayjs(date);

/** Неделя с понедельника: дни `YYYY-MM-DD` с понедельника по воскресенье. */
export function weekDays(date: string): string[] {
  const d = asDay(date);
  const monday = d.subtract((d.day() + 6) % 7, 'day');
  return Array.from({ length: 7 }, (_, i) => monday.add(i, 'day').format('YYYY-MM-DD'));
}

/** Сетка месяца: 6 недель с понедельника, покрывающие месяц даты. */
export function monthGrid(date: string): [string, string] {
  const first = asDay(date).startOf('month');
  const start = first.subtract((first.day() + 6) % 7, 'day');
  return [start.format('YYYY-MM-DD'), start.add(41, 'day').format('YYYY-MM-DD')];
}

/** Дни (включительно), которые показывает вид. */
export function viewRange(view: CalendarView, date: string): [string, string] {
  if (view === 'day') return [date, date];
  if (view === 'week') {
    const days = weekDays(date);
    return [days[0] ?? date, days[6] ?? date];
  }
  return monthGrid(date);
}

/** Сдвиг даты стрелками «←/→» на шаг вида. */
export const shiftDate = (view: CalendarView, date: string, dir: -1 | 1) =>
  asDay(date)
    .add(dir, view === 'day' ? 'day' : view === 'week' ? 'week' : 'month')
    .format('YYYY-MM-DD');

/** Момент (ISO) → минуты от полуночи дня в поясе салона. */
export const minutesOfDay = (iso: string) => {
  const t = inSalonTz(iso);
  return t.hour() * 60 + t.minute();
};

/** Длительность записи в минутах. */
export const durationMinutes = (startAt: string, endAt: string) =>
  Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60_000);

/** Время окна графика `HH:MM[:SS]` → минуты от полуночи. */
export const parseClock = (value: string) => {
  const [h = '0', m = '0'] = value.split(':');
  return Number(h) * 60 + Number(m);
};

/** Минуты от полуночи → `HH:MM`. */
export const formatClock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** День салона + минуты от полуночи → ISO для API. 24:00 — полночь следующего дня. */
export const toIso = (date: string, minutes: number): string =>
  minutes >= 24 * 60
    ? toIso(asDay(date).add(1, 'day').format('YYYY-MM-DD'), minutes - 24 * 60)
    : dayjs.tz(`${date} ${formatClock(minutes)}`, SALON_TZ).toISOString();

/** День, которому принадлежит момент (в поясе салона). */
export const dayOf = (iso: string) => inSalonTz(iso).format('YYYY-MM-DD');

/** Первая буква заглавная: dayjs отдаёт «вересень», «понеділок». */
export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Заголовок даты в шапке: «Понеділок» и «28 вересня 2026». */
export const dateTitle = (date: string): { weekday: string; full: string } => {
  const d: Dayjs = asDay(date);
  return {
    weekday: capitalize(d.format('dddd')),
    full: d.format('D MMMM YYYY'),
  };
};
