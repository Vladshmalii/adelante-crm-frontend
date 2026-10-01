import { z } from 'zod';

export const BOOKING_STEPS = ['service', 'master', 'datetime', 'details', 'confirm'] as const;
export type BookingStep = (typeof BOOKING_STEPS)[number];

/** «Будь-який майстер» — бекенд назначит свободного. */
export const ANY_MASTER = 'any';

/**
 * Выбор клиента в URL: «назад» в браузере работает, ссылку можно отправить. Имя и телефон
 * в адрес не кладём — они живут в форме.
 */
export const bookingSearchSchema = z.object({
  step: z.enum(BOOKING_STEPS).default('service'),
  service: z.string().optional(),
  master: z.string().optional(),
  /** День `YYYY-MM-DD` в поясе салона. */
  date: z.string().optional(),
  /** Начало записи (ISO) — из свободного времени бекенда. */
  slot: z.string().optional(),
});

export type BookingSearch = z.infer<typeof bookingSearchSchema>;

export const reviewSearchSchema = z.object({ token: z.string().optional() });
