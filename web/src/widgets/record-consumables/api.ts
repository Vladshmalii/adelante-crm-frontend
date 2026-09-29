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

/** Ответ списания и отмены — полный список расходников записи; кладём его в кеш сразу. */
function useApplyConsumables(recordId: string) {
  const queryClient = useQueryClient();
  return (consumables: Schema<'ConsumableOut'>[]) => {
    queryClient.setQueryData(consumablesQueryOptions(recordId).queryKey, consumables);
    // Остатки склада и история записи изменились.
    void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    void queryClient.invalidateQueries({ queryKey: ['records', 'detail', recordId] });
  };
}

export function useWriteOffConsumables(recordId: string) {
  const apply = useApplyConsumables(recordId);
  return useMutation({
    mutationFn: async (items: Schema<'ConsumableIn'>[]) =>
      unwrap(
        await api.POST('/api/admin/v1/records/{record_id}/consumables', {
          params: { path: { record_id: recordId } },
          body: { items },
        }),
      ).data,
    onSuccess: apply,
  });
}

/** Отмена списания: товар возвращается на склад обратным движением, запись остаётся в истории. */
export function useCancelConsumable(recordId: string) {
  const apply = useApplyConsumables(recordId);
  return useMutation({
    mutationFn: async (movementId: string) =>
      unwrap(
        await api.DELETE('/api/admin/v1/records/{record_id}/consumables/{movement_id}', {
          params: { path: { record_id: recordId, movement_id: movementId } },
        }),
      ).data,
    onSuccess: apply,
  });
}
