import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';

import { calendarKeys } from './calendar.queries';

type RecordItem = Schema<'RecordOut'>;

/**
 * После изменения записи: сама запись — сразу из ответа, остальное (сетка, сводка, статистика
 * клиента, финансы после оплаты) — перезапросом.
 */
function useRecordChanged() {
  const queryClient = useQueryClient();
  return (record?: RecordItem) => {
    if (record) {
      queryClient.setQueryData(calendarKeys.record(record.id), (prev: object | undefined) =>
        prev ? { ...prev, ...record } : prev,
      );
    }
    void queryClient.invalidateQueries({ queryKey: ['records'] });
    void queryClient.invalidateQueries({ queryKey: ['clients'] });
  };
}

export function useCreateRecord() {
  const changed = useRecordChanged();
  return useMutation({
    mutationFn: async (body: Schema<'RecordCreateIn'>) =>
      unwrap(await api.POST('/api/admin/v1/records', { body })).data,
    onSuccess: changed,
  });
}

export function useUpdateRecord() {
  const changed = useRecordChanged();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Schema<'RecordPatchIn'> }) =>
      unwrap(
        await api.PATCH('/api/admin/v1/records/{record_id}', {
          params: { path: { record_id: id } },
          body,
        }),
      ).data,
    onSuccess: changed,
  });
}

export function useSetRecordStatus() {
  const changed = useRecordChanged();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Schema<'RecordStatus'> }) =>
      unwrap(
        await api.POST('/api/admin/v1/records/{record_id}/status', {
          params: { path: { record_id: id } },
          body: { status },
        }),
      ).data,
    onSuccess: changed,
  });
}

/** Завершение визита: нотатки и фото; оплата — отдельным шагом. */
export function useCompleteRecord() {
  const changed = useRecordChanged();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Schema<'CompleteIn'> }) =>
      unwrap(
        await api.POST('/api/admin/v1/records/{record_id}/complete', {
          params: { path: { record_id: id } },
          body,
        }),
      ).data,
    onSuccess: (record) => {
      changed(record);
    },
  });
}

/** Оплата завершённого визита — создаёт чек (только администратор). */
export function usePayRecord() {
  const queryClient = useQueryClient();
  const changed = useRecordChanged();
  return useMutation({
    mutationFn: async ({ id, payments }: { id: string; payments: Schema<'PaymentIn'>[] }) =>
      unwrap(
        await api.POST('/api/admin/v1/records/{record_id}/payment', {
          params: { path: { record_id: id } },
          body: { payments },
        }),
      ).data,
    onSuccess: ({ record }) => {
      changed(record);
      void queryClient.invalidateQueries({ queryKey: ['finances'] });
    },
  });
}

/** Фото процедуры → URL для `photoUrls`. */
export async function uploadPhoto(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  return unwrap(
    await api.POST('/api/admin/v1/uploads', {
      body: form as unknown as Schema<'Body_upload_file_api_admin_v1_uploads_post'>,
    }),
  ).data.url;
}
