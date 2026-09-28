import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';

export const consumablesQueryOptions = (recordId: string) =>
  queryOptions({
    queryKey: ['records', 'consumables', recordId] as const,
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/records/{record_id}/consumables', {
          params: { path: { record_id: recordId } },
          signal,
        }),
      ).data,
  });

/**
 * Товары для выбора при списании. Мастеру бекенд отдаёт только активные товары с названием,
 * единицей и остатком — этого достаточно.
 */
export const productPickerQueryOptions = (query: string) =>
  queryOptions({
    queryKey: ['inventory', 'picker', query] as const,
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/inventory/products', {
          params: { query: { query: query || undefined, perPage: 30 } },
          signal,
        }),
      ).data,
    staleTime: 30_000,
  });

export function useWriteOffConsumables(recordId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: Schema<'ConsumableIn'>[]) =>
      unwrap(
        await api.POST('/api/admin/v1/records/{record_id}/consumables', {
          params: { path: { record_id: recordId } },
          body: { items },
        }),
      ).data,
    onSuccess: (consumables) => {
      queryClient.setQueryData(consumablesQueryOptions(recordId).queryKey, consumables);
      // Остатки склада и история записи изменились.
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
      void queryClient.invalidateQueries({ queryKey: ['records', 'detail', recordId] });
    },
  });
}
