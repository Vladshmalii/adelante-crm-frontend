import { keepPreviousData, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';

/**
 * Абонементы (backend/docs/subscriptions.md). Типы и проданные абонементы общие для сети —
 * живут в Master DB, поэтому ключи не зависят от салона (кроме `usableForSalon`).
 */
export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  types: () => [...subscriptionKeys.all, 'types'] as const,
  client: (clientId: string, usableForSalon?: string) =>
    [...subscriptionKeys.all, 'client', clientId, usableForSalon ?? null] as const,
  one: (id: string) => [...subscriptionKeys.all, 'one', id] as const,
  operations: (id: string) => [...subscriptionKeys.all, 'operations', id] as const,
  registry: (params: SubscriptionsRegistryParams) =>
    [...subscriptionKeys.all, 'registry', params] as const,
};

export interface SubscriptionsRegistryParams {
  status?: Schema<'SubscriptionStatus'>;
  typeId?: string;
  salonId?: string;
  q?: string;
  page: number;
  perPage: number;
}

/** Типы сети, включая архивные: продаются только активные. Читает и администратор. */
export const subscriptionTypesQueryOptions = () =>
  queryOptions({
    queryKey: subscriptionKeys.types(),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/subscriptions/types', { signal })).data,
  });

/**
 * Абонементы клиента, новые сверху. `usableForSalon` — только те, которыми сейчас можно
 * оплатить услугу этого салона (subscriptions.md, 14.5).
 */
export const clientSubscriptionsQueryOptions = (clientId: string, usableForSalon?: string) =>
  queryOptions({
    queryKey: subscriptionKeys.client(clientId, usableForSalon),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/clients/{client_id}/subscriptions', {
          params: { path: { client_id: clientId }, query: { usableForSalon } },
          signal,
        }),
      ).data,
  });

export const subscriptionQueryOptions = (id: string) =>
  queryOptions({
    queryKey: subscriptionKeys.one(id),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/subscriptions/{subscription_id}', {
          params: { path: { subscription_id: id } },
          signal,
        }),
      ).data,
  });

/** Журнал операций абонемента, новые сверху. */
export const subscriptionOperationsQueryOptions = (id: string) =>
  queryOptions({
    queryKey: subscriptionKeys.operations(id),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/subscriptions/{subscription_id}/operations', {
          params: { path: { subscription_id: id } },
          signal,
        }),
      ).data,
  });

/** Реестр проданных абонементов сети (суперюзер). */
export const subscriptionsRegistryQueryOptions = (params: SubscriptionsRegistryParams) =>
  queryOptions({
    queryKey: subscriptionKeys.registry(params),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/subscriptions', {
          params: { query: { ...params, q: params.q === '' ? undefined : params.q } },
          signal,
        }),
      ),
    placeholderData: keepPreviousData,
  });

/** Создать или изменить тип (суперюзер). */
export function useSaveSubscriptionType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: Schema<'SubscriptionTypePatchIn'> }) =>
      id
        ? unwrap(
            await api.PATCH('/api/admin/v1/subscriptions/types/{type_id}', {
              params: { path: { type_id: id } },
              body,
            }),
          ).data
        : unwrap(
            await api.POST('/api/admin/v1/subscriptions/types', {
              body: body as Schema<'SubscriptionTypeIn'>,
            }),
          ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subscriptionKeys.types() }),
  });
}

/** Заморозка и разморозка: без тела, отказ — 409 текстом бекенда. */
export function useFreezeSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'freeze' | 'unfreeze' }) =>
      unwrap(
        action === 'freeze'
          ? await api.POST('/api/admin/v1/subscriptions/{subscription_id}/freeze', {
              params: { path: { subscription_id: id } },
            })
          : await api.POST('/api/admin/v1/subscriptions/{subscription_id}/unfreeze', {
              params: { path: { subscription_id: id } },
            }),
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subscriptionKeys.all }),
  });
}
