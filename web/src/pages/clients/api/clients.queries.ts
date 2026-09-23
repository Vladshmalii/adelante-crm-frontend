import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { api, unwrap } from '@/shared/api';

import type { ClientsListParams } from '../model/search';

export const clientsKeys = {
  all: ['clients'] as const,
  list: (params: ClientsListParams) => [...clientsKeys.all, 'list', params] as const,
  detail: (id: string) => [...clientsKeys.all, 'detail', id] as const,
  visits: (id: string, page: number) => [...clientsKeys.all, 'visits', id, page] as const,
};

export const clientsListQueryOptions = (params: ClientsListParams) =>
  queryOptions({
    queryKey: clientsKeys.list(params),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/clients', { params: { query: params }, signal })),
    placeholderData: keepPreviousData,
  });

export const clientQueryOptions = (id: string) =>
  queryOptions({
    queryKey: clientsKeys.detail(id),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/clients/{client_id}', {
          params: { path: { client_id: id } },
          signal,
        }),
      ).data,
  });

export const VISITS_PER_PAGE = 10;

export const clientVisitsQueryOptions = (id: string, page: number) =>
  queryOptions({
    queryKey: clientsKeys.visits(id, page),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/clients/{client_id}/visits', {
          params: { path: { client_id: id }, query: { page, perPage: VISITS_PER_PAGE } },
          signal,
        }),
      ),
    placeholderData: keepPreviousData,
  });
