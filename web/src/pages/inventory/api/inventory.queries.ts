import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { api, unwrap } from '@/shared/api';

import type { InventorySearch } from '../model/search';

export const inventoryKeys = {
  all: ['inventory'] as const,
  products: (search: InventorySearch) => [...inventoryKeys.all, 'products', search] as const,
  summary: () => [...inventoryKeys.all, 'summary'] as const,
  categories: () => [...inventoryKeys.all, 'categories'] as const,
  movements: (productId: string, page: number) =>
    [...inventoryKeys.all, 'movements', productId, page] as const,
};

/** Страница товаров целиком (`data` + `meta` для пагинации). */
export const productsQueryOptions = (search: InventorySearch) =>
  queryOptions({
    queryKey: inventoryKeys.products(search),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/inventory/products', { params: { query: search }, signal }),
      ),
    placeholderData: keepPreviousData,
  });

export const inventorySummaryQueryOptions = () =>
  queryOptions({
    queryKey: inventoryKeys.summary(),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/inventory/summary', { signal })).data,
  });

export const inventoryCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: inventoryKeys.categories(),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/inventory/categories', { signal })).data,
  });

export const movementsQueryOptions = (productId: string, page: number) =>
  queryOptions({
    queryKey: inventoryKeys.movements(productId, page),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/inventory/products/{product_id}/movements', {
          params: { path: { product_id: productId }, query: { page, perPage: 20 } },
          signal,
        }),
      ),
    placeholderData: keepPreviousData,
  });
