import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';
import { saveBlob } from '@/shared/lib';

import { clientsKeys } from './clients.queries';

function useInvalidateClients() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: clientsKeys.all });
}

export function useCreateClient() {
  const invalidate = useInvalidateClients();
  return useMutation({
    mutationFn: async (body: Schema<'ClientCreateIn'>) =>
      unwrap(await api.POST('/api/admin/v1/clients', { body })).data,
    onSuccess: invalidate,
  });
}

export function useUpdateClient() {
  const invalidate = useInvalidateClients();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Schema<'ClientPatchIn'> }) =>
      unwrap(
        await api.PATCH('/api/admin/v1/clients/{client_id}', {
          params: { path: { client_id: id } },
          body,
        }),
      ).data,
    onSuccess: invalidate,
  });
}

export function useDeleteClient() {
  const invalidate = useInvalidateClients();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(
        await api.DELETE('/api/admin/v1/clients/{client_id}', {
          params: { path: { client_id: id } },
        }),
      );
    },
    onSuccess: invalidate,
  });
}

export function useImportClients() {
  const invalidate = useInvalidateClients();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return unwrap(
        await api.POST('/api/admin/v1/clients/import', {
          // multipart: openapi-fetch отдаёт FormData как есть, браузер сам ставит boundary.
          body: form as unknown as Schema<'Body_import_clients_api_admin_v1_clients_import_post'>,
        }),
      ).data;
    },
    onSuccess: invalidate,
  });
}

export function useExportClients() {
  return useMutation({
    mutationFn: async (includeVisits: boolean) => {
      const blob = unwrap(
        await api.GET('/api/admin/v1/clients/export', {
          params: { query: { includeVisits } },
          parseAs: 'blob',
        }),
      );
      saveBlob(blob, 'clients.xlsx');
    },
  });
}
