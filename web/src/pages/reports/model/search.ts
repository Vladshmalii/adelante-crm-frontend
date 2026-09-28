import { z } from 'zod';

import { currentMonth, dayRangeToApi } from '@/shared/lib';

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Период и группировка отчётов — в URL. Без периода — текущий месяц салона. */
export const reportsSearchSchema = z.object({
  from: day.optional(),
  to: day.optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

export type ReportsSearch = z.infer<typeof reportsSearchSchema>;
export type GroupBy = ReportsSearch['groupBy'];

export const period = (s: Pick<ReportsSearch, 'from' | 'to'>): [string, string] =>
  s.from && s.to ? [s.from, s.to] : currentMonth();

/** Период в API: полуоткрытый интервал `[dateFrom, dateTo)` по киевским суткам. */
export const periodToApi = (s: Pick<ReportsSearch, 'from' | 'to'>) => {
  const [from, to] = period(s);
  const range = dayRangeToApi(from, to);
  return { dateFrom: range.dateFrom ?? '', dateTo: range.dateTo ?? '' };
};
