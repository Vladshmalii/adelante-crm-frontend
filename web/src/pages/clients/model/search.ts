import { z } from 'zod';

export const CLIENT_SORTS = ['name', 'lastVisit', 'totalSpent', 'totalVisits'] as const;

/** Состояние страницы клиентов в URL: ссылкой можно поделиться, «назад» работает. */
export const clientsSearchSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(25),
  query: z.string().optional(),
  segment: z.enum(['new', 'repeat', 'lost']).optional(),
  category: z.enum(['vip', 'regular', 'new', 'inactive']).optional(),
  sort: z.enum(CLIENT_SORTS).default('name'),
  /** Открытая карточка клиента (ссылки из поиска и из записи ведут сюда). */
  id: z.string().optional(),
});

export type ClientsSearch = z.infer<typeof clientsSearchSchema>;
export type ClientSort = (typeof CLIENT_SORTS)[number];

/** Параметры списка для API — без состояния UI (открытой карточки). */
export const toListParams = ({ id: _id, ...params }: ClientsSearch) => params;
export type ClientsListParams = ReturnType<typeof toListParams>;
