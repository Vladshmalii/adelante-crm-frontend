import { z } from 'zod';

/** Фильтры услуг — в URL; фильтрует бекенд (в старом UI фильтрация была на клиенте). */
export const servicesSearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  priceFrom: z.number().nonnegative().optional(),
  priceTo: z.number().nonnegative().optional(),
});

export type ServicesSearch = z.infer<typeof servicesSearchSchema>;
