import dayjs, { type Dayjs } from 'dayjs';

import type { Schema } from '@/shared/api';

export type DaySchedule = Schema<'DayScheduleIn'>;
export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export type WeekSchedule = Record<Weekday, DaySchedule>;

export const DAY_LABELS: Record<Weekday, string> = {
  monday: 'Понеділок',
  tuesday: 'Вівторок',
  wednesday: 'Середа',
  thursday: 'Четвер',
  friday: "П'ятниця",
  saturday: 'Субота',
  sunday: 'Неділя',
};

const DEFAULT_WORK_DAY: DaySchedule = {
  isWorkDay: true,
  start: '09:00',
  end: '18:00',
  breakStart: null,
  breakEnd: null,
};

/** API отдаёт время как `HH:mm:ss`, принимает `HH:mm`. */
export const toDayjs = (time: string | null | undefined) =>
  time ? dayjs(`2000-01-01T${time.slice(0, 5)}`) : null;
export const toTime = (value: Dayjs | null | undefined) => (value ? value.format('HH:mm') : null);

/** Неделя по умолчанию: пн–пт 09–18, выходные. */
export const defaultWeek = (): WeekSchedule =>
  Object.fromEntries(
    WEEKDAYS.map((day) => [
      day,
      day === 'saturday' || day === 'sunday'
        ? { ...DEFAULT_WORK_DAY, isWorkDay: false }
        : { ...DEFAULT_WORK_DAY },
    ]),
  ) as WeekSchedule;

/** Ответ API → значение редактора (время обрезается до `HH:mm`, пустые дни — выходные). */
export function weekFromApi(week: Record<string, DaySchedule>): WeekSchedule {
  const base = defaultWeek();
  // График ещё ни разу не сохраняли — бекенд отдаёт все дни пустыми; предлагаем типовую неделю.
  if (Object.values(week).every((d) => !d.isWorkDay && !d.start)) return base;
  for (const day of WEEKDAYS) {
    const d = week[day];
    if (d) {
      base[day] = {
        isWorkDay: d.isWorkDay,
        start: d.start?.slice(0, 5) ?? null,
        end: d.end?.slice(0, 5) ?? null,
        breakStart: d.breakStart?.slice(0, 5) ?? null,
        breakEnd: d.breakEnd?.slice(0, 5) ?? null,
      };
    }
  }
  return base;
}
