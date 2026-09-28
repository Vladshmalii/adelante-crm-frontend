import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';
import { saveBlob } from '@/shared/lib';

import { inventoryKeys } from './inventory.queries';

/** Любое изменение склада меняет остатки, KPI и счётчики категорий — обновляем всё разом. */
function useInvalidateInventory() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
}

export function useCreateProduct() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: async (body: Schema<'ProductCreateIn'>) =>
      unwrap(await api.POST('/api/admin/v1/inventory/products', { body })).data,
    onSuccess: invalidate,
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Schema<'ProductPatchIn'> }) =>
      unwrap(
        await api.PATCH('/api/admin/v1/inventory/products/{product_id}', {
          params: { path: { product_id: id } },
          body,
        }),
      ).data,
    onSuccess: invalidate,
  });
}

/** Мягкое удаление: товар пропадает из списка, история движений остаётся. */
export function useDeleteProduct() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(
        await api.DELETE('/api/admin/v1/inventory/products/{product_id}', {
          params: { path: { product_id: id } },
        }),
      );
    },
    onSuccess: invalidate,
  });
}

export function useRestoreProduct() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(
        await api.PATCH('/api/admin/v1/inventory/products/{product_id}', {
          params: { path: { product_id: id } },
          body: { isActive: true },
        }),
      ).data,
    onSuccess: invalidate,
  });
}

export function useCreateMovement() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: async ({ productId, body }: { productId: string; body: Schema<'MovementIn'> }) =>
      unwrap(
        await api.POST('/api/admin/v1/inventory/products/{product_id}/movements', {
          params: { path: { product_id: productId } },
          body,
        }),
      ).data,
    onSuccess: invalidate,
  });
}

export function useCreateCategory() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: async (name: string) =>
      unwrap(await api.POST('/api/admin/v1/inventory/categories', { body: { name } })).data,
    onSuccess: invalidate,
  });
}

export function useRenameCategory() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) =>
      unwrap(
        await api.PATCH('/api/admin/v1/inventory/categories/{category_id}', {
          params: { path: { category_id: id } },
          body: { name },
        }),
      ).data,
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: async ({ id, mode }: { id: string; mode: Schema<'CategoryDeleteMode'> }) => {
      unwrap(
        await api.DELETE('/api/admin/v1/inventory/categories/{category_id}', {
          params: { path: { category_id: id }, query: { mode } },
        }),
      );
    },
    onSuccess: invalidate,
  });
}

export function useImportInventory() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return unwrap(
        await api.POST('/api/admin/v1/inventory/import', {
          // multipart: openapi-fetch отдаёт FormData как есть, браузер сам ставит boundary.
          body: form as unknown as Schema<'Body_import_products_api_admin_v1_inventory_import_post'>,
        }),
      ).data;
    },
    onSuccess: invalidate,
  });
}

export type ExportBlock = 'main' | 'stock' | 'finance' | 'description';

export function useExportInventory() {
  return useMutation({
    mutationFn: async ({ blocks, categoryId }: { blocks: ExportBlock[]; categoryId?: string }) => {
      const blob = unwrap(
        await api.GET('/api/admin/v1/inventory/export', {
          params: { query: { blocks: blocks.join(','), categoryId } },
          parseAs: 'blob',
        }),
      );
      saveBlob(blob, 'inventory.xlsx');
    },
  });
}
