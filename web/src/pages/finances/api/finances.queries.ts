import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { api, unwrap } from '@/shared/api';

import type { documentsParams, operationsParams, receiptsParams } from '../model/search';

export const financesKeys = {
  all: ['finances'] as const,
  dashboard: (dateFrom: string, dateTo: string) =>
    [...financesKeys.all, 'dashboard', dateFrom, dateTo] as const,
  operations: (p: object) => [...financesKeys.all, 'operations', p] as const,
  documents: (p: object) => [...financesKeys.all, 'documents', p] as const,
  receipts: (p: object) => [...financesKeys.all, 'receipts', p] as const,
  methods: () => [...financesKeys.all, 'methods'] as const,
  registers: () => [...financesKeys.all, 'registers'] as const,
};

export const dashboardQueryOptions = (dateFrom: string, dateTo: string) =>
  queryOptions({
    queryKey: financesKeys.dashboard(dateFrom, dateTo),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/finances/dashboard', {
          params: { query: { dateFrom, dateTo } },
          signal,
        }),
      ).data,
    placeholderData: keepPreviousData,
  });

export const operationsQueryOptions = (params: ReturnType<typeof operationsParams>) =>
  queryOptions({
    queryKey: financesKeys.operations(params),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/finances/operations', { params: { query: params }, signal }),
      ),
    placeholderData: keepPreviousData,
  });

export const documentsQueryOptions = (params: ReturnType<typeof documentsParams>) =>
  queryOptions({
    queryKey: financesKeys.documents(params),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/finances/documents', { params: { query: params }, signal }),
      ),
    placeholderData: keepPreviousData,
  });

export const receiptsQueryOptions = (params: ReturnType<typeof receiptsParams>) =>
  queryOptions({
    queryKey: financesKeys.receipts(params),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/finances/receipts', { params: { query: params }, signal }),
      ),
    placeholderData: keepPreviousData,
  });

export const paymentMethodsQueryOptions = () =>
  queryOptions({
    queryKey: financesKeys.methods(),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/finances/payment-methods', { signal })).data,
  });

export const cashRegistersQueryOptions = () =>
  queryOptions({
    queryKey: financesKeys.registers(),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/finances/cash-registers', { signal })).data,
  });
