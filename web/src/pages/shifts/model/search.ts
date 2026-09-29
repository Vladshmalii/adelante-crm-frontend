import { z } from 'zod';

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Период сетки в URL: с какого понедельника и сколько недель (бекенд — не больше 62 дней). */
export const shiftsSearchSchema = z.object({
  from: day.optional(),
  weeks: z.union([z.literal(1), z.literal(2), z.literal(4)]).default(2),
});

export type ShiftsSearch = z.infer<typeof shiftsSearchSchema>;
