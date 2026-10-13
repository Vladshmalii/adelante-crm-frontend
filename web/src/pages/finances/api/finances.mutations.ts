import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';
import { saveBlob } from '@/shared/lib';

import { financesKeys } from './finances.queries';

/**
 * Любое изменение в финансах двигает балансы касс и дашборд — сбрасываем весь раздел.
 * Чек с `recordId` меняет и статус оплаты записи, поэтому сбрасываем и записи.
 */
function useInvalidateFinances() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: financesKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['records'] }),
      // Чек со счёта / кешбэком и отмена чека меняют счета и карты клиента
      queryClient.invalidateQueries({ queryKey: ['loyalty'] }),
      queryClient.invalidateQueries({ queryKey: ['clients'] }),
    ]);
}

const idPath = <K extends string>(key: K, id: string) => ({
  path: { [key]: id } as Record<K, string>,
});

export function useCreateOperation() {
  const onSuccess = useInvalidateFinances();
  return useMutation({
    mutationFn: async (body: Schema<'OperationCreateIn'>) =>
      unwrap(await api.POST('/api/admin/v1/finances/operations', { body })).data,
    onSuccess,
  });
}

export function useUpdateOperation() {
  const onSuccess = useInvalidateFinances();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Schema<'OperationPatchIn'> }) =>
      unwrap(
        await api.PATCH('/api/admin/v1/finances/operations/{operation_id}', {
          params: idPath('operation_id', id),
          body,
        }),
      ).data,
    onSuccess,
  });
}

export function useCreateDocument() {
  const onSuccess = useInvalidateFinances();
  return useMutation({
    mutationFn: async (body: Schema<'DocumentCreateIn'>) =>
      unwrap(await api.POST('/api/admin/v1/finances/documents', { body })).data,
    onSuccess,
  });
}

export function useUpdateDocument() {
  const onSuccess = useInvalidateFinances();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Schema<'DocumentPatchIn'> }) =>
      unwrap(
        await api.PATCH('/api/admin/v1/finances/documents/{document_id}', {
          params: idPath('document_id', id),
          body,
        }),
      ).data,
    onSuccess,
  });
}

/** Чек: продажа или оплата визита. Ключ идемпотентности — на одно открытие формы. */
export function useCreateReceipt() {
  const onSuccess = useInvalidateFinances();
  return useMutation({
    mutationFn: async ({ key, body }: { key: string; body: Schema<'ReceiptCreateIn'> }) =>
      unwrap(
        await api.POST('/api/admin/v1/finances/receipts', {
          headers: { 'Idempotency-Key': key },
          body,
        }),
      ).data,
    onSuccess,
  });
}

export function useCancelReceipt() {
  const onSuccess = useInvalidateFinances();
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(
        await api.POST('/api/admin/v1/finances/receipts/{receipt_id}/cancel', {
          params: idPath('receipt_id', id),
        }),
      ).data,
    onSuccess,
  });
}

export function useCreatePaymentMethod() {
  const onSuccess = useInvalidateFinances();
  return useMutation({
    mutationFn: async (body: Schema<'PaymentMethodCreateIn'>) =>
      unwrap(await api.POST('/api/admin/v1/finances/payment-methods', { body })).data,
    onSuccess,
  });
}

export function useUpdatePaymentMethod() {
  const onSuccess = useInvalidateFinances();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Schema<'PaymentMethodPatchIn'> }) =>
      unwrap(
        await api.PATCH('/api/admin/v1/finances/payment-methods/{method_id}', {
          params: idPath('method_id', id),
          body,
        }),
      ).data,
    onSuccess,
  });
}

export function useCreateCashRegister() {
  const onSuccess = useInvalidateFinances();
  return useMutation({
    mutationFn: async (body: Schema<'CashRegisterCreateIn'>) =>
      unwrap(await api.POST('/api/admin/v1/finances/cash-registers', { body })).data,
    onSuccess,
  });
}

export function useCreateExpenseCategory() {
  const onSuccess = useInvalidateFinances();
  return useMutation({
    mutationFn: async (name: string) =>
      unwrap(await api.POST('/api/admin/v1/finances/expense-categories', { body: { name } })).data,
    onSuccess,
  });
}

export function useRenameExpenseCategory() {
  const onSuccess = useInvalidateFinances();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) =>
      unwrap(
        await api.PATCH('/api/admin/v1/finances/expense-categories/{category_id}', {
          params: idPath('category_id', id),
          body: { name },
        }),
      ).data,
    onSuccess,
  });
}

export function useDeleteExpenseCategory() {
  const onSuccess = useInvalidateFinances();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(
        await api.DELETE('/api/admin/v1/finances/expense-categories/{category_id}', {
          params: idPath('category_id', id),
        }),
      );
    },
    onSuccess,
  });
}

export function useExportFinances() {
  return useMutation({
    mutationFn: async ({
      dateFrom,
      dateTo,
      label,
    }: {
      dateFrom: string;
      dateTo: string;
      /** Период для имени файла (`YYYY-MM-DD_YYYY-MM-DD`), в поясе салона. */
      label: string;
    }) => {
      const blob = unwrap(
        await api.GET('/api/admin/v1/finances/export', {
          params: { query: { dateFrom, dateTo } },
          parseAs: 'blob',
        }),
      );
      saveBlob(blob, `finances_${label}.xlsx`);
    },
  });
}
