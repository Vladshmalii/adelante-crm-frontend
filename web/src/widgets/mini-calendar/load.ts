import type { Schema } from '@/shared/api';

type DaySummary = Schema<'DaySummaryOut'>;

/** Загрузка дня: доля занятого рабочего времени; `null` — день нерабочий или пустой. */
export function dayLoad(day: DaySummary | undefined): number | null {
  if (!day || day.total === 0 || day.workMinutes <= 0) return null;
  return Math.min(day.bookedMinutes / day.workMinutes, 1);
}
