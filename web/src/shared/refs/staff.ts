import { queryOptions } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';

/**
 * Справочник сотрудников для выпадающих списков (фильтр по мастеру, автор изменения,
 * мастера услуги). Страницы не импортируют друг друга, поэтому общий запрос живёт здесь.
 */
export const staffRefQueryOptions = (role?: Schema<'Role'>) =>
  queryOptions({
    queryKey: ['staff', 'ref', role ?? 'all'] as const,
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/staff', {
          params: { query: { role, status: 'active', perPage: 200 } },
          signal,
        }),
      ).data,
    staleTime: 5 * 60_000,
  });

export const personName = (s: Pick<Schema<'StaffOut'>, 'firstName' | 'lastName'>) =>
  [s.lastName, s.firstName].filter(Boolean).join(' ');

export const staffOptions = (staff: Schema<'StaffOut'>[] | undefined) =>
  (staff ?? []).map((s) => ({ value: s.id, label: personName(s) }));
