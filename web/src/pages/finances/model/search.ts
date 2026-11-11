import { z } from 'zod';

import { currentMonth, dayRangeToApi } from '@/shared/lib';

export const FINANCE_TABS = ['overview', 'operations', 'documents', 'receipts', 'methods'] as const;
export type FinanceTab = (typeof FINANCE_TABS)[number];

/**
 * Вкладки, переехавшие в «Лояльність» (frontend-loyalty-page.md, решение 5). Схема их ещё
 * принимает, чтобы старые ссылки не падали на валидации: роут редиректит их на новые страницы.
 */
export const MOVED_FINANCE_TABS = ['balances', 'certificates'] as const;

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Состояние «Фінансів» в URL. Период общий для всех вкладок, остальные фильтры — свои. */
export const financesSearchSchema = z.object({
  tab: z.enum([...FINANCE_TABS, ...MOVED_FINANCE_TABS]).default('overview'),
  from: day.optional(),
  to: day.optional(),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(25),
  opType: z.enum(['income', 'expense', 'transfer']).optional(),
  cashRegisterId: z.string().optional(),
  paymentMethodId: z.string().optional(),
  docType: z.enum(['receipt', 'invoice', 'expense', 'income', 'act']).optional(),
  docStatus: z.enum(['draft', 'issued', 'paid', 'cancelled']).optional(),
  receiptStatus: z.enum(['paid', 'partial', 'cancelled']).optional(),
});

export type FinancesSearch = z.infer<typeof financesSearchSchema>;

/** Период из URL или текущий месяц салона (дашборд и экспорт требуют период). */
export const period = (s: Pick<FinancesSearch, 'from' | 'to'>): [string, string] =>
  s.from && s.to ? [s.from, s.to] : currentMonth();

export const periodToApi = (s: Pick<FinancesSearch, 'from' | 'to'>) => {
  const [from, to] = period(s);
  const range = dayRangeToApi(from, to);
  return { dateFrom: range.dateFrom ?? '', dateTo: range.dateTo ?? '' };
};

const paging = (s: FinancesSearch) => ({ page: s.page, perPage: s.perPage });

export const operationsParams = (s: FinancesSearch) => ({
  ...paging(s),
  ...periodToApi(s),
  type: s.opType,
  cashRegisterId: s.cashRegisterId,
  paymentMethodId: s.paymentMethodId,
});

export const documentsParams = (s: FinancesSearch) => ({
  ...paging(s),
  ...periodToApi(s),
  type: s.docType,
  status: s.docStatus,
});

export const receiptsParams = (s: FinancesSearch) => ({
  ...paging(s),
  ...periodToApi(s),
  status: s.receiptStatus,
});
