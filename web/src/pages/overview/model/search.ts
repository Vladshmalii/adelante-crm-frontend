import { z } from 'zod';

export const OVERVIEW_TABS = ['records', 'reviews', 'changes'] as const;
export type OverviewTab = (typeof OVERVIEW_TABS)[number];

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * Состояние вкладок «Огляду» в URL. Фильтры у каждой вкладки свои; при смене вкладки
 * они сбрасываются (см. OverviewPage).
 */
export const overviewSearchSchema = z.object({
  tab: z.enum(OVERVIEW_TABS).default('records'),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(25),
  /** Записи — дата визита; отзывы и журнал — дата создания. */
  from: day.optional(),
  to: day.optional(),
  // Записи
  createdFrom: day.optional(),
  createdTo: day.optional(),
  masterId: z.string().optional(),
  /** Только записи «Без майстра» (очередь). */
  withoutMaster: z.boolean().optional(),
  status: z
    .enum(['scheduled', 'confirmed', 'arrived', 'completed', 'cancelled', 'no_show'])
    .optional(),
  source: z.enum(['admin', 'booking', 'bot', 'phone', 'walk_in']).optional(),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid']).optional(),
  clientQuery: z.string().optional(),
  /** Открытая карточка записи. */
  recordId: z.string().optional(),
  // Відгуки
  rating: z.number().int().min(1).max(5).optional(),
  reviewType: z.enum(['positive', 'neutral', 'negative']).optional(),
  // Журнал змін
  entity: z.string().optional(),
  action: z.enum(['created', 'updated', 'deleted']).optional(),
  authorId: z.string().optional(),
});

export type OverviewSearch = z.infer<typeof overviewSearchSchema>;
