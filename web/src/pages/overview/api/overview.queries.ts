import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { api, unwrap } from '@/shared/api';
import { dayRangeToApi } from '@/shared/lib';

import type { OverviewSearch } from '../model/search';

export const overviewKeys = {
  records: (params: object) => ['records', 'list', params] as const,
  record: (id: string) => ['records', 'detail', id] as const,
  reviews: (params: object) => ['reviews', 'list', params] as const,
  audit: (params: object) => ['audit', 'list', params] as const,
};

const paging = (s: OverviewSearch) => ({ page: s.page, perPage: s.perPage });

export const recordsParams = (s: OverviewSearch) => {
  const created = dayRangeToApi(s.createdFrom, s.createdTo);
  return {
    ...paging(s),
    ...dayRangeToApi(s.from, s.to),
    createdFrom: created.dateFrom,
    createdTo: created.dateTo,
    masterId: s.masterId,
    status: s.status,
    source: s.source,
    paymentStatus: s.paymentStatus,
    clientQuery: s.clientQuery,
  };
};

export const reviewsParams = (s: OverviewSearch) => ({
  ...paging(s),
  ...dayRangeToApi(s.from, s.to),
  rating: s.rating,
  type: s.reviewType,
});

export const auditParams = (s: OverviewSearch) => ({
  ...paging(s),
  ...dayRangeToApi(s.from, s.to),
  entity: s.entity,
  action: s.action,
  authorId: s.authorId,
});

export const recordsQueryOptions = (params: ReturnType<typeof recordsParams>) =>
  queryOptions({
    queryKey: overviewKeys.records(params),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/records', { params: { query: params }, signal })),
    placeholderData: keepPreviousData,
  });

export const recordQueryOptions = (id: string) =>
  queryOptions({
    queryKey: overviewKeys.record(id),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/records/{record_id}', {
          params: { path: { record_id: id } },
          signal,
        }),
      ).data,
  });

export const reviewsQueryOptions = (params: ReturnType<typeof reviewsParams>) =>
  queryOptions({
    queryKey: overviewKeys.reviews(params),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/reviews', { params: { query: params }, signal })),
    placeholderData: keepPreviousData,
  });

export const auditQueryOptions = (params: ReturnType<typeof auditParams>) =>
  queryOptions({
    queryKey: overviewKeys.audit(params),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/audit', { params: { query: params }, signal })),
    placeholderData: keepPreviousData,
  });
