import { keepPreviousData, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';

/**
 * Подарочные сертификаты (backend/docs/certificates.md). Шаблоны и сертификаты общие для сети —
 * живут в Master DB, поэтому ключи не зависят от салона.
 */
export const certificateKeys = {
  all: ['certificates'] as const,
  templates: () => [...certificateKeys.all, 'templates'] as const,
  receipt: (receiptId: string) => [...certificateKeys.all, 'receipt', receiptId] as const,
  client: (clientId: string) => [...certificateKeys.all, 'client', clientId] as const,
  lookup: (body: Schema<'CertificateLookupIn'>) =>
    [...certificateKeys.all, 'lookup', body] as const,
  history: (id: string) => [...certificateKeys.all, 'history', id] as const,
  registry: (params: RegistryParams) => [...certificateKeys.all, 'registry', params] as const,
};

export interface RegistryParams {
  code?: string;
  status?: Schema<'CertificateStatus'>;
  soldSalonId?: string;
  page: number;
  perPage: number;
}

/** Шаблоны сети, включая скрытые: продаются только активные. */
export const certificateTemplatesQueryOptions = () =>
  queryOptions({
    queryKey: certificateKeys.templates(),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/certificates/templates', { signal })).data,
  });

/** Сертификаты, выпущенные чеком салона: коды для показа, печати и активации. */
export const receiptCertificatesQueryOptions = (receiptId: string) =>
  queryOptions({
    queryKey: certificateKeys.receipt(receiptId),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/receipts/{receipt_id}/certificates', {
          params: { path: { receipt_id: receiptId } },
          signal,
        }),
      ).data,
  });

/** Сертификаты клиента: свои и купленные им. */
export const clientCertificatesQueryOptions = (clientId: string) =>
  queryOptions({
    queryKey: certificateKeys.client(clientId),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/clients/{client_id}/certificates', {
          params: { path: { client_id: clientId } },
          signal,
        }),
      ).data,
  });

/**
 * Проверка кода в окне оплаты: остаток и сколько можно оплатить в этом чеке. POST — код не
 * попадает в URL. Окончательно сервер проверяет при оплате.
 */
export const certificateLookupQueryOptions = (body: Schema<'CertificateLookupIn'>) =>
  queryOptions({
    queryKey: certificateKeys.lookup(body),
    queryFn: async ({ signal }) =>
      unwrap(await api.POST('/api/admin/v1/certificates/lookup', { body, signal })).data,
    placeholderData: keepPreviousData,
    retry: false,
  });

/** История сертификата: продажа, погашения, сторно, сгорание, аннулирование. */
export const certificateHistoryQueryOptions = (id: string) =>
  queryOptions({
    queryKey: certificateKeys.history(id),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/certificates/{certificate_id}/transactions', {
          params: { path: { certificate_id: id } },
          signal,
        }),
      ).data,
  });

/** Реестр сертификатов сети (суперюзер). */
export const certificatesRegistryQueryOptions = (params: RegistryParams) =>
  queryOptions({
    queryKey: certificateKeys.registry(params),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/certificates', {
          params: { query: { ...params, code: params.code === '' ? undefined : params.code } },
          signal,
        }),
      ),
    placeholderData: keepPreviousData,
  });

export function useCancelCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      unwrap(
        await api.POST('/api/admin/v1/certificates/{certificate_id}/cancel', {
          params: { path: { certificate_id: id } },
          body: { reason },
        }),
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: certificateKeys.all }),
  });
}

export function useActivateCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) =>
      unwrap(
        await api.POST('/api/admin/v1/certificates/{certificate_id}/activate', {
          params: { path: { certificate_id: id } },
          body: { clientId },
        }),
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: certificateKeys.all }),
  });
}
