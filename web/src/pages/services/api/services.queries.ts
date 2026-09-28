import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { api, unwrap } from '@/shared/api';

import type { ServicesSearch } from '../model/search';

export const servicesKeys = {
  all: ['services'] as const,
  list: (search: ServicesSearch) => [...servicesKeys.all, 'list', search] as const,
  categories: () => [...servicesKeys.all, 'categories'] as const,
};

export const servicesListQueryOptions = (search: ServicesSearch) =>
  queryOptions({
    queryKey: servicesKeys.list(search),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/services', { params: { query: search }, signal })).data,
    placeholderData: keepPreviousData,
  });

export const serviceCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: servicesKeys.categories(),
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/services/categories', { signal })).data,
    staleTime: 5 * 60_000,
  });
