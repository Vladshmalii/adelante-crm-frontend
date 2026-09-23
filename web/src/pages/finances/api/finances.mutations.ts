import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, type Schema, unwrap } from '@/shared/api';
import { saveBlob } from '@/shared/lib';

import { financesKeys } from './finances.queries';

/** Любое изменение в финансах двигает балансы касс и дашборд — сбрасываем весь раздел. */
function useInvalidateFinances() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: financesKeys.all });
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

export function useCreateReceipt() {
  const onSuccess = useInvalidateFinances();
  return useMutation({
    mutationFn: async (body: Schema<'ReceiptCreateIn'>) =>
      unwrap(await api.POST('/api/admin/v1/finances/receipts', { body })).data,
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
