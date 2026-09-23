import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';

import type { StaffSearch } from '../model/search';

export const staffKeys = {
  all: ['staff'] as const,
  list: (search: StaffSearch) => [...staffKeys.all, 'list', search] as const,
  count: (status: Schema<'StaffStatus'>) => [...staffKeys.all, 'count', status] as const,
  schedule: (id: string) => [...staffKeys.all, 'schedule', id] as const,
  stats: (id: string, from: string, to: string) =>
    [...staffKeys.all, 'stats', id, from, to] as const,
};

export const staffListQueryOptions = (search: StaffSearch) =>
  queryOptions({
    queryKey: staffKeys.list(search),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/staff', { params: { query: search }, signal })),
    placeholderData: keepPreviousData,
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

export const staffScheduleQueryOptions = (id: string) =>
  queryOptions({
    queryKey: staffKeys.schedule(id),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/staff/{staff_id}/schedule', {
          params: { path: { staff_id: id } },
          signal,
        }),
      ).data,
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
