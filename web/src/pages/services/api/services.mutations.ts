import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';

import { servicesKeys } from './services.queries';

function useInvalidateServices() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: servicesKeys.all });
}

export function useCreateService() {
  const invalidate = useInvalidateServices();
  return useMutation({
    mutationFn: async (body: Schema<'ServiceCreateIn'>) =>
      unwrap(await api.POST('/api/admin/v1/services', { body })).data,
    onSuccess: invalidate,
  });
}

export function useUpdateService() {
  const invalidate = useInvalidateServices();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Schema<'ServicePatchIn'> }) =>
      unwrap(
        await api.PATCH('/api/admin/v1/services/{service_id}', {
          params: { path: { service_id: id } },
          body,
        }),
      ).data,
    onSuccess: invalidate,
  });
}

/** DELETE на бекенде не удаляет, а архивирует услугу. */
export function useArchiveService() {
  const invalidate = useInvalidateServices();
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(
        await api.DELETE('/api/admin/v1/services/{service_id}', {
          params: { path: { service_id: id } },
        }),
      ),
    onSuccess: invalidate,
  });
}

/** Категории услуг. Название категории видно и в записях — их тоже перечитываем. */
function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: servicesKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['records'] }),
    ]);
}

export function useCreateServiceCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: async (name: string) =>
      unwrap(await api.POST('/api/admin/v1/services/categories', { body: { name } })).data,
    onSuccess: invalidate,
  });
}

export function useRenameServiceCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) =>
      unwrap(
        await api.PATCH('/api/admin/v1/services/categories/{category_id}', {
          params: { path: { category_id: id } },
          body: { name },
        }),
      ).data,
    onSuccess: invalidate,
  });
}

/** Услуги удалённой категории бекенд переносит в «Інше». */
export function useDeleteServiceCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(
        await api.DELETE('/api/admin/v1/services/categories/{category_id}', {
          params: { path: { category_id: id } },
        }),
      );
    },
    onSuccess: invalidate,
  });
}
