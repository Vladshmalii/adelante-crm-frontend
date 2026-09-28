import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';
import { meQueryOptions } from '@/shared/auth';

/** Свои контакты (`PATCH /auth/me`). Имя, должность и оклад меняет администратор. */
export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Schema<'MePatchIn'>) =>
      unwrap(await api.PATCH('/api/admin/v1/auth/me', { body })).data,
    onSuccess: (me) => {
      queryClient.setQueryData(meQueryOptions.queryKey, me);
    },
  });
}

/** Загрузка файла (аватар) → URL для сохранения в профиле. */
export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  return unwrap(
    await api.POST('/api/admin/v1/uploads', {
      body: form as unknown as Schema<'Body_upload_file_api_admin_v1_uploads_post'>,
    }),
  ).data.url;
}
