import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';

import type { StaffListParams } from '../model/search';

export const staffKeys = {
  all: ['staff'] as const,
  list: (params: StaffListParams) => [...staffKeys.all, 'list', params] as const,
  detail: (id: string) => [...staffKeys.all, 'detail', id] as const,
  count: (status: Schema<'StaffStatus'>) => [...staffKeys.all, 'count', status] as const,
  stats: (id: string, from: string, to: string) =>
    [...staffKeys.all, 'stats', id, from, to] as const,
};

export const staffListQueryOptions = (params: StaffListParams) =>
  queryOptions({
    queryKey: staffKeys.list(params),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/staff', { params: { query: params }, signal })),
    placeholderData: keepPreviousData,
  });

export const staffMemberQueryOptions = (id: string) =>
  queryOptions({
    queryKey: staffKeys.detail(id),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/staff/{staff_id}', {
          params: { path: { staff_id: id } },
          signal,
        }),
      ).data,
  });

/** Количество сотрудников в статусе — для KPI (отдельного эндпоинта статистики нет). */
export const staffCountQueryOptions = (status: Schema<'StaffStatus'>) =>
  queryOptions({
    queryKey: staffKeys.count(status),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/staff', {
          params: { query: { status, perPage: 1 } },
          signal,
        }),
      ).meta?.total ?? 0,
  });

export const staffStatsQueryOptions = (id: string, dateFrom: string, dateTo: string) =>
  queryOptions({
    queryKey: staffKeys.stats(id, dateFrom, dateTo),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/staff/{staff_id}/stats', {
          params: { path: { staff_id: id }, query: { dateFrom, dateTo } },
          signal,
        }),
      ).data,
    placeholderData: keepPreviousData,
  });
