import { z } from 'zod';

export const staffSearchSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(25),
  query: z.string().optional(),
  status: z.enum(['active', 'vacation', 'sick', 'fired']).default('active'),
  role: z.enum(['administrator', 'master']).optional(),
  /** Открытая карточка сотрудника (прямая ссылка). */
  id: z.string().optional(),
});

export type StaffSearch = z.infer<typeof staffSearchSchema>;

/** Параметры списка для API — без открытой карточки. */
export const toListParams = ({ id: _id, ...params }: StaffSearch) => params;
export type StaffListParams = ReturnType<typeof toListParams>;
