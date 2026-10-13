import { keepPreviousData, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';

/**
 * Особовий рахунок, карты лояльности и предпросмотр оплаты (backend/docs/loyalty-accounts.md).
 * Счета и карты общие для сети — живут в Master DB, поэтому ключи не зависят от салона,
 * кроме предпросмотра оплаты и `appliesHere` у карт.
 */
export const loyaltyKeys = {
  all: ['loyalty'] as const,
  account: (clientId: string) => [...loyaltyKeys.all, 'account', clientId] as const,
  accountTxns: (clientId: string, page: number) =>
    [...loyaltyKeys.all, 'account-txns', clientId, page] as const,
  cards: (clientId: string, status: Schema<'CardStatus'>) =>
    [...loyaltyKeys.all, 'cards', clientId, status] as const,
  cardTxns: (cardId: string) => [...loyaltyKeys.all, 'card-txns', cardId] as const,
  cardVisits: (cardId: string) => [...loyaltyKeys.all, 'card-visits', cardId] as const,
  cardTypes: () => [...loyaltyKeys.all, 'card-types'] as const,
  checkout: (recordId: string, bonusIds: string[]) =>
    [...loyaltyKeys.all, 'checkout', recordId, bonusIds] as const,
  saleCheckout: (clientId: string | undefined, subtotal: number) =>
    [...loyaltyKeys.all, 'sale-checkout', clientId, subtotal] as const,
};

export const TXNS_PER_PAGE = 10;

export const accountQueryOptions = (clientId: string) =>
  queryOptions({
    queryKey: loyaltyKeys.account(clientId),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/clients/{client_id}/account', {
          params: { path: { client_id: clientId } },
          signal,
        }),
      ).data,
  });

export const accountTransactionsQueryOptions = (clientId: string, page: number) =>
  queryOptions({
    queryKey: loyaltyKeys.accountTxns(clientId, page),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/clients/{client_id}/account/transactions', {
          params: { path: { client_id: clientId }, query: { page, perPage: TXNS_PER_PAGE } },
          signal,
        }),
      ),
    placeholderData: keepPreviousData,
  });

export const clientCardsQueryOptions = (clientId: string, status: Schema<'CardStatus'>) =>
  queryOptions({
    queryKey: loyaltyKeys.cards(clientId, status),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/clients/{client_id}/loyalty-cards', {
          params: { path: { client_id: clientId }, query: { status } },
          signal,
        }),
      ).data,
  });

export const cardTransactionsQueryOptions = (cardId: string) =>
  queryOptions({
    queryKey: loyaltyKeys.cardTxns(cardId),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/loyalty-cards/{card_id}/transactions', {
          params: { path: { card_id: cardId }, query: { perPage: 100 } },
          signal,
        }),
      ).data,
  });

export const cardVisitsQueryOptions = (cardId: string) =>
  queryOptions({
    queryKey: loyaltyKeys.cardVisits(cardId),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/loyalty-cards/{card_id}/visits', {
          params: { path: { card_id: cardId }, query: { perPage: 100 } },
          signal,
        }),
      ).data,
  });

export const cardTypesQueryOptions = () =>
  queryOptions({
    queryKey: loyaltyKeys.cardTypes(),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/loyalty/card-types', { signal })).data,
  });

export const recordCheckoutQueryOptions = (recordId: string, bonusIds: string[]) =>
  queryOptions({
    queryKey: loyaltyKeys.checkout(recordId, bonusIds),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/records/{record_id}/checkout', {
          params: {
            path: { record_id: recordId },
            query: bonusIds.length ? { bonusRecordServiceIds: bonusIds } : {},
          },
          signal,
        }),
      ).data,
    placeholderData: keepPreviousData,
  });

export const saleCheckoutQueryOptions = (clientId: string | undefined, subtotal: number) =>
  queryOptions({
    queryKey: loyaltyKeys.saleCheckout(clientId, subtotal),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/finances/receipts/checkout', {
          params: { query: { subtotal, clientId } },
          signal,
        }),
      ).data,
    placeholderData: keepPreviousData,
  });

/** Пары «счёт — список клиентов»: баланс и номер карты видны и в списке клиентов. */
function useInvalidateLoyalty() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['clients'] }),
      queryClient.invalidateQueries({ queryKey: ['finances'] }),
    ]);
}

/** Ключ идемпотентности на одно открытие формы: двойной клик не проведёт операцию дважды. */
export const newOperationKey = () => crypto.randomUUID();

export function useTopup(clientId: string) {
  const onSuccess = useInvalidateLoyalty();
  return useMutation({
    mutationFn: async ({ key, body }: { key: string; body: Schema<'TopupIn'> }) =>
      unwrap(
        await api.POST('/api/admin/v1/clients/{client_id}/account/topups', {
          params: { path: { client_id: clientId } },
          headers: { 'Idempotency-Key': key },
          body,
        }),
      ).data,
    onSuccess,
  });
}

export function useRefund(clientId: string) {
  const onSuccess = useInvalidateLoyalty();
  return useMutation({
    mutationFn: async ({ key, body }: { key: string; body: Schema<'RefundIn'> }) =>
      unwrap(
        await api.POST('/api/admin/v1/clients/{client_id}/account/refunds', {
          params: { path: { client_id: clientId } },
          headers: { 'Idempotency-Key': key },
          body,
        }),
      ).data,
    onSuccess,
  });
}

export function useAdjustAccount(clientId: string) {
  const onSuccess = useInvalidateLoyalty();
  return useMutation({
    mutationFn: async ({ key, body }: { key: string; body: Schema<'AdjustmentIn'> }) =>
      unwrap(
        await api.POST('/api/admin/v1/clients/{client_id}/account/adjustments', {
          params: { path: { client_id: clientId } },
          headers: { 'Idempotency-Key': key },
          body,
        }),
      ).data,
    onSuccess,
  });
}

export function useAdjustCashback(cardId: string) {
  const onSuccess = useInvalidateLoyalty();
  return useMutation({
    mutationFn: async ({ key, body }: { key: string; body: Schema<'CashbackAdjustmentIn'> }) =>
      unwrap(
        await api.POST('/api/admin/v1/loyalty-cards/{card_id}/cashback-adjustments', {
          params: { path: { card_id: cardId } },
          headers: { 'Idempotency-Key': key },
          body,
        }),
      ).data,
    onSuccess,
  });
}

export function useIssueCard(clientId: string) {
  const onSuccess = useInvalidateLoyalty();
  return useMutation({
    mutationFn: async (body: Schema<'CardIssueIn'>) =>
      unwrap(
        await api.POST('/api/admin/v1/clients/{client_id}/loyalty-cards', {
          params: { path: { client_id: clientId } },
          body,
        }),
      ).data,
    onSuccess,
  });
}

export function useDeleteCard() {
  const onSuccess = useInvalidateLoyalty();
  return useMutation({
    mutationFn: async (cardId: string) =>
      unwrap(
        await api.DELETE('/api/admin/v1/loyalty-cards/{card_id}', {
          params: { path: { card_id: cardId } },
        }),
      ).data,
    onSuccess,
  });
}

export async function generateCardNumber() {
  return unwrap(await api.GET('/api/admin/v1/loyalty-cards/generate-number')).data.number;
}
