import { keepPreviousData, queryOptions, useMutation } from '@tanstack/react-query';

import { api, unwrap } from '@/shared/api';
import { saveBlob } from '@/shared/lib';

import type { GroupBy } from '../model/search';

interface Period {
  dateFrom: string;
  dateTo: string;
}

const reportsKeys = {
  all: ['reports'] as const,
  report: (name: string, params: object) => [...reportsKeys.all, name, params] as const,
};

export const summaryQueryOptions = (period: Period) =>
  queryOptions({
    queryKey: reportsKeys.report('summary', period),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/reports/summary', { params: { query: period }, signal }))
        .data,
    placeholderData: keepPreviousData,
  });

/** Только суперюзеру: администратору бекенд отвечает 403. */
export const revenueQueryOptions = (period: Period, groupBy: GroupBy) =>
  queryOptions({
    queryKey: reportsKeys.report('revenue', { ...period, groupBy }),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/reports/revenue', {
          params: { query: { ...period, groupBy } },
          signal,
        }),
      ).data,
    placeholderData: keepPreviousData,
  });

export const clientsReportQueryOptions = (period: Period, groupBy: GroupBy) =>
  queryOptions({
    queryKey: reportsKeys.report('clients', { ...period, groupBy }),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/reports/clients', {
          params: { query: { ...period, groupBy } },
          signal,
        }),
      ).data,
    placeholderData: keepPreviousData,
  });

export const staffReportQueryOptions = (period: Period) =>
  queryOptions({
    queryKey: reportsKeys.report('staff', period),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/reports/staff', { params: { query: period }, signal }))
        .data,
    placeholderData: keepPreviousData,
  });

export const servicesReportQueryOptions = (period: Period) =>
  queryOptions({
    queryKey: reportsKeys.report('services', period),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/reports/services', { params: { query: period }, signal }))
        .data,
    placeholderData: keepPreviousData,
  });

/** Все отчёты одним Excel; администратору — без листа «Виручка» и денежных колонок. */
export function useExportReports() {
  return useMutation({
    mutationFn: async ({ label, ...query }: Period & { groupBy: GroupBy; label: string }) => {
      const blob = unwrap(
        await api.GET('/api/admin/v1/reports/export', {
          params: { query },
          parseAs: 'blob',
        }),
      );
      saveBlob(blob, `reports_${label}.xlsx`);
    },
  });
}
