import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';
import { cardTypesQueryOptions, loyaltyKeys } from '@/widgets/loyalty';

export { cardTypesQueryOptions };

export const bonusRulesQueryOptions = (typeId: string) =>
  queryOptions({
    queryKey: [...loyaltyKeys.all, 'bonus-rules', typeId] as const,
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/loyalty/card-types/{type_id}/bonus-rules', {
          params: { path: { type_id: typeId } },
          signal,
        }),
      ).data,
  });

/**
 * Каталог услуг другого салона сети: в бонусном правиле выбираются эквивалентные услуги
 * каждого салона типа карты (у салонов свои id услуг).
 */
export const salonServicesQueryOptions = (salonId: string) =>
  queryOptions({
    queryKey: ['services', 'by-salon', salonId] as const,
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/services', {
          headers: { 'X-Salon-Id': salonId },
          signal,
        }),
      ).data,
    staleTime: 60_000,
  });

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: loyaltyKeys.all });
}

export function useSaveCardType() {
  const onSuccess = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: Schema<'CardTypeIn'> }) =>
      id
        ? unwrap(
            await api.PATCH('/api/admin/v1/loyalty/card-types/{type_id}', {
              params: { path: { type_id: id } },
              body,
            }),
          ).data
        : unwrap(await api.POST('/api/admin/v1/loyalty/card-types', { body })).data,
    onSuccess,
  });
}

export function useSaveBonusRule(typeId: string) {
  const onSuccess = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: Schema<'BonusRuleIn'> }) =>
      id
        ? unwrap(
            await api.PATCH('/api/admin/v1/loyalty/card-types/{type_id}/bonus-rules/{rule_id}', {
              params: { path: { type_id: typeId, rule_id: id } },
              body,
            }),
          ).data
        : unwrap(
            await api.POST('/api/admin/v1/loyalty/card-types/{type_id}/bonus-rules', {
              params: { path: { type_id: typeId } },
              body,
            }),
          ).data,
    onSuccess,
  });
}

export function useDeleteBonusRule(typeId: string) {
  const onSuccess = useInvalidate();
  return useMutation({
    mutationFn: async (ruleId: string) => {
      unwrap(
        await api.DELETE('/api/admin/v1/loyalty/card-types/{type_id}/bonus-rules/{rule_id}', {
          params: { path: { type_id: typeId, rule_id: ruleId } },
        }),
      );
    },
    onSuccess,
  });
}
