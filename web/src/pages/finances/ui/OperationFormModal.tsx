import {
  ModalForm,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { App } from 'antd';
import type { Dayjs } from 'dayjs';
import { useMemo } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { fromPickerDateTime, inSalonTz, toPickerDateTime } from '@/shared/lib';

import { useCreateOperation, useUpdateOperation } from '../api/finances.mutations';
import { cashRegistersQueryOptions, paymentMethodsQueryOptions } from '../api/finances.queries';
import { operationStatusLabels, operationTypeLabels, tagOptions } from '../model/labels';

type Operation = Schema<'OperationOut'>;

interface FormValues {
  type: Schema<'OperationType'>;
  amount: number;
  date: Dayjs;
  category?: string;
  description?: string;
  paymentMethodId?: string;
  cashRegisterId?: string;
  status?: Schema<'OperationStatus'>;
}

interface OperationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Редактирование: бекенд меняет только суму, категорію, опис, дату и статус. */
  operation?: Operation;
}

const blankToNull = (v?: string) => (v?.trim() ? v : null);

export function OperationFormModal({ open, onOpenChange, operation }: OperationFormModalProps) {
  const { message } = App.useApp();
  const create = useCreateOperation();
  const update = useUpdateOperation();
  const { data: methods } = useQuery({ ...paymentMethodsQueryOptions(), enabled: open });
  const { data: registers } = useQuery({ ...cashRegistersQueryOptions(), enabled: open });
  const isEdit = !!operation;

  // Значения по умолчанию (например, «сейчас») фиксируем на момент открытия формы:
  // ProForm не принимает изменение initialValues после инициализации.
  const initialValues = useMemo(
    () =>
      operation
        ? {
            ...operation,
            amount: Number(operation.amount),
            date: toPickerDateTime(operation.date),
            category: operation.category ?? undefined,
            description: operation.description ?? undefined,
            paymentMethodId: operation.paymentMethod?.id ?? undefined,
            cashRegisterId: operation.cashRegister?.id ?? undefined,
          }
        : { type: 'income', date: toPickerDateTime(inSalonTz(new Date()).toISOString()) },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- пересчёт только при открытии
    [open, operation],
  );

  return (
    <ModalForm<FormValues>
      title={isEdit ? 'Редагувати операцію' : 'Нова операція'}
      open={open}
      onOpenChange={onOpenChange}
      width={640}
      grid
      rowProps={{ gutter: 16 }}
      colProps={{ span: 12 }}
      // Даты нужны как Dayjs: в API уходят через пояс салона (fromPickerDateTime).
      dateFormatter={false}
      modalProps={{ destroyOnHidden: true }}
      initialValues={initialValues}
      submitter={{ searchConfig: { submitText: 'Зберегти', resetText: 'Скасувати' } }}
      onFinish={async (v) => {
        try {
          const common = {
            amount: v.amount,
            date: fromPickerDateTime(v.date),
            category: blankToNull(v.category),
            description: blankToNull(v.description),
          };
          if (operation) {
            await update.mutateAsync({ id: operation.id, body: { ...common, status: v.status } });
          } else {
            await create.mutateAsync({
              ...common,
              type: v.type,
              paymentMethodId: v.paymentMethodId ?? null,
              cashRegisterId: v.cashRegisterId ?? null,
            });
          }
          message.success(isEdit ? 'Операцію оновлено' : 'Операцію створено');
          return true;
        } catch (error) {
          message.error(errorMessage(error));
          return false;
        }
      }}
    >
      <ProFormSelect
        name="type"
        label="Тип"
        allowClear={false}
        disabled={isEdit}
        options={tagOptions(operationTypeLabels)}
      />
      <ProFormDigit
        name="amount"
        label="Сума"
        min={0.01}
        fieldProps={{ suffix: '₴', precision: 2 }}
        rules={[{ required: true, message: 'Вкажіть суму' }]}
      />
      <ProFormDateTimePicker
        name="date"
        label="Дата і час"
        fieldProps={{ format: 'DD.MM.YYYY HH:mm', style: { width: '100%' } }}
        rules={[{ required: true, message: 'Вкажіть дату' }]}
      />
      <ProFormText name="category" label="Категорія" placeholder="Наприклад: Оренда" />
      <ProFormSelect
        name="cashRegisterId"
        label="Каса"
        disabled={isEdit}
        options={(registers ?? []).map((r) => ({ value: r.id, label: r.name }))}
      />
      <ProFormSelect
        name="paymentMethodId"
        label="Метод оплати"
        disabled={isEdit}
        options={(methods ?? [])
          .filter((m) => m.isActive)
          .map((m) => ({ value: m.id, label: m.name }))}
      />
      {isEdit && (
        <ProFormSelect
          name="status"
          label="Статус"
          allowClear={false}
          options={tagOptions(operationStatusLabels)}
        />
      )}
      <ProFormTextArea name="description" label="Опис" colProps={{ span: 24 }} />
    </ModalForm>
  );
}
