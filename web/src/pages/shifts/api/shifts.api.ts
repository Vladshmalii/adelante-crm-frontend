import { keepPreviousData, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';
import { dayRangeToApi } from '@/shared/lib';

export const shiftsKeys = {
  all: ['shifts'] as const,
  grid: (from: string, to: string) => ['shifts', 'grid', from, to] as const,
};

/** Сетка смен: часы салона по дням и сотрудники со сменами и отметками. */
export const shiftGridQueryOptions = (from: string, to: string) =>
  queryOptions({
    queryKey: shiftsKeys.grid(from, to),
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/shifts', {
          params: { query: { dateFrom: from, dateTo: to } },
          signal,
        }),
      ).data,
    placeholderData: keepPreviousData,
  });

/** Записи мастера на день — в карточке ячейки. */
export const masterDayRecordsQueryOptions = (masterId: string, date: string) =>
  queryOptions({
    queryKey: ['records', 'shift-day', masterId, date] as const,
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/records', {
          params: { query: { masterId, ...dayRangeToApi(date, date), perPage: 100 } },
          signal,
        }),
      ).data.filter((r) => r.status !== 'cancelled'),
  });

/** Смены влияют и на Розклад: рабочее время мастеров и загрузку дней. */
function useShiftsChanged() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: shiftsKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['schedule'] });
    void queryClient.invalidateQueries({ queryKey: ['records', 'daily-summary'] });
  };
}

export function useSaveShift() {
  const changed = useShiftsChanged();
  return useMutation({
    mutationFn: async ({
      staffId,
      date,
      body,
    }: {
      staffId: string;
      date: string;
      body: Schema<'ShiftIn'> | null;
    }) => {
      if (body === null) {
        unwrap(
          await api.DELETE('/api/admin/v1/shifts/{staffId}/{date}', {
            params: { path: { staffId, date } },
          }),
        );
        return null;
      }
      return unwrap(
        await api.PUT('/api/admin/v1/shifts/{staffId}/{date}', {
          params: { path: { staffId, date } },
          body,
        }),
      ).data;
    },
    onSuccess: changed,
  });
}

export function useFillShifts() {
  const changed = useShiftsChanged();
  return useMutation({
    mutationFn: async (body: Schema<'FillIn'>) =>
      unwrap(await api.POST('/api/admin/v1/shifts/fill', { body })).data,
    onSuccess: changed,
  });
}
