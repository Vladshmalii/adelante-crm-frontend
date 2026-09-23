import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';

import { staffKeys } from './staff.queries';

function useInvalidateStaff() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: staffKeys.all });
}

export function useCreateStaff() {
  const invalidate = useInvalidateStaff();
  return useMutation({
    mutationFn: async (body: Schema<'StaffCreateIn'>) =>
      unwrap(await api.POST('/api/admin/v1/staff', { body })).data,
    onSuccess: invalidate,
  });
}

export function useUpdateStaff() {
  const invalidate = useInvalidateStaff();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Schema<'StaffPatchIn'> }) =>
      unwrap(
        await api.PATCH('/api/admin/v1/staff/{staff_id}', {
          params: { path: { staff_id: id } },
          body,
        }),
      ).data,
    onSuccess: invalidate,
  });
}

/** Увольнение (status=fired). Бекенд вернёт 409, если у мастера есть будущие записи. */
export function useFireStaff() {
  const invalidate = useInvalidateStaff();
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(
        await api.DELETE('/api/admin/v1/staff/{staff_id}', {
          params: { path: { staff_id: id } },
        }),
      ).data,
    onSuccess: invalidate,
  });
}

export function useSaveSchedule(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (week: Record<string, Schema<'DayScheduleIn'>>) =>
      unwrap(
        await api.POST('/api/admin/v1/staff/{staff_id}/schedule', {
          params: { path: { staff_id: id } },
          body: week,
        }),
      ).data,
    onSuccess: (schedule) => {
      queryClient.setQueryData(staffKeys.schedule(id), schedule);
    },
  });
}

export function useAddScheduleException(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schema<'ExceptionIn'>) =>
      unwrap(
        await api.POST('/api/admin/v1/staff/{staff_id}/schedule/exceptions', {
          params: { path: { staff_id: id } },
          body,
        }),
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKeys.schedule(id) }),
  });
}
