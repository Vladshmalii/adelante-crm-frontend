import { queryOptions } from '@tanstack/react-query';

import { api, unwrap } from '@/shared/api';

const LIMIT = 5;

export const searchClientsQuery = (query: string) =>
  queryOptions({
    queryKey: ['search', 'clients', query] as const,
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/clients', {
          params: { query: { query, perPage: LIMIT } },
          signal,
        }),
      ).data,
    staleTime: 30_000,
  });

export const searchStaffQuery = (query: string) =>
  queryOptions({
    queryKey: ['search', 'staff', query] as const,
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/staff', {
          params: { query: { query, perPage: LIMIT } },
          signal,
        }),
      ).data,
    staleTime: 30_000,
  });

export const searchServicesQuery = (query: string) =>
  queryOptions({
    queryKey: ['search', 'services', query] as const,
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/services', { params: { query: { query } }, signal }),
      ).data.slice(0, LIMIT),
    staleTime: 30_000,
  });
