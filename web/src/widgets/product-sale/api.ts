import { queryOptions } from '@tanstack/react-query';

import { api, unwrap } from '@/shared/api';

/** Активные товары для продажи; ключ в `['inventory']` — сбрасывается после оплаты и отмены. */
export const saleProductsQueryOptions = (query: string) =>
  queryOptions({
    queryKey: ['inventory', 'sale-picker', query] as const,
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/inventory/products', {
          params: { query: { query: query || undefined, perPage: 30 } },
          signal,
        }),
      ).data,
    staleTime: 30_000,
  });
