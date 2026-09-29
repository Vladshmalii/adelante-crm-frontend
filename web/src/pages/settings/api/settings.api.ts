import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';
import { meQueryOptions } from '@/shared/auth';

export const settingsKeys = {
  salon: ['settings', 'salon'] as const,
  schedule: ['settings', 'schedule'] as const,
};

export const salonInfoQueryOptions = () =>
  queryOptions({
    queryKey: settingsKeys.salon,
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/settings/salon', { signal })).data,
  });

export const salonScheduleQueryOptions = () =>
  queryOptions({
    queryKey: settingsKeys.schedule,
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/api/admin/v1/settings/schedule', { signal })).data,
  });

export function useUpdateSalonInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schema<'SalonInfoPatchIn'>) =>
      unwrap(await api.PATCH('/api/admin/v1/settings/salon', { body })).data,
    onSuccess: (salon) => {
      queryClient.setQueryData(settingsKeys.salon, salon);
      // Название салона в переключателе берётся из /auth/me.
      void queryClient.invalidateQueries({ queryKey: meQueryOptions.queryKey });
    },
  });
}

/**
 * Часы салона. Бекенд подгоняет под них будущие смены и возвращает отчёт `shifts`
 * (обрезано, удалено, конфликты с записями).
 */
export function useSaveSalonSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (week: Record<string, Schema<'SalonDay'>>) =>
      unwrap(await api.PUT('/api/admin/v1/settings/schedule', { body: { week } })).data,
    onSuccess: ({ configured, week }) => {
      queryClient.setQueryData(settingsKeys.schedule, { configured, week });
      // Смены и рабочее время мастеров могли измениться.
      void queryClient.invalidateQueries({ queryKey: ['shifts'] });
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
}
