import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';
import { saveBlob } from '@/shared/lib';

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

/** Восстановление уволенного: `PATCH` со `status: active`. */
export function useRestoreStaff() {
  const invalidate = useInvalidateStaff();
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(
        await api.PATCH('/api/admin/v1/staff/{staff_id}', {
          params: { path: { staff_id: id } },
          body: { status: 'active' },
        }),
      ).data,
    onSuccess: invalidate,
  });
}

export function useExportStaff() {
  return useMutation({
    mutationFn: async () => {
      const blob = unwrap(await api.GET('/api/admin/v1/staff/export', { parseAs: 'blob' }));
      saveBlob(blob, 'staff.xlsx');
    },
  });
}

/** Увольнение (status=fired). Бекенд вернёт 409 для себя и для мастера с будущими записями. */
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
