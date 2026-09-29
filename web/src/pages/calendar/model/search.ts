import { z } from 'zod';

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const STEPS = [5, 15, 30, 60] as const;
export type Step = (typeof STEPS)[number];

/**
 * Состояние Розкладу в URL: вид, дата, шаг сетки, фильтр мастеров и открытая запись —
 * ссылкой можно поделиться, «назад» в браузере работает.
 */
export const calendarSearchSchema = z.object({
  view: z.enum(['day', 'week', 'month']).default('day'),
  /** День в поясе салона; нет — сегодня. */
  date: day.optional(),
  step: z.union([z.literal(5), z.literal(15), z.literal(30), z.literal(60)]).default(30),
  /** «Усі» или только те, кто работает в выбранный день (неделю) или имеет записи. */
  staff: z.enum(['all', 'working']).default('all'),
  /** Скрытые колонки мастеров (по умолчанию видны все). */
  hide: z.array(z.string()).optional(),
  /** Открытая карточка записи. */
  recordId: z.string().optional(),
  /** Открыть «Новий запис» (кнопка в меню, `Alt+N`). */
  create: z.boolean().optional(),
});

export type CalendarSearch = z.infer<typeof calendarSearchSchema>;
export type CalendarView = CalendarSearch['view'];
