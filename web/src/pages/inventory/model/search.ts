import { z } from 'zod';

/** Фильтры, сортировка и пагинация склада — в URL; фильтрует бекенд. */
export const inventorySearchSchema = z.object({
  query: z.string().optional(),
  categoryId: z.string().optional(),
  stockStatus: z.enum(['in_stock', 'low', 'out']).optional(),
  /** Показать и удалённые (мягко) товары — чтобы восстановить. */
  includeInactive: z.boolean().optional(),
  sort: z.enum(['name', 'sku', 'quantity', 'createdAt']).optional(),
  desc: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(25),
});

export type InventorySearch = z.infer<typeof inventorySearchSchema>;
