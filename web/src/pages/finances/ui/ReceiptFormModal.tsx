import {
  ModalForm,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormList,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { App } from 'antd';
import type { Dayjs } from 'dayjs';
import { useMemo } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { fromPickerDateTime, inSalonTz, toOptions, toPickerDateTime } from '@/shared/lib';

import { useCreateReceipt } from '../api/finances.mutations';
import { paymentMethodsQueryOptions } from '../api/finances.queries';
import { receiptSourceLabels } from '../model/labels';

interface FormValues {
  clientName?: string;
  date: Dayjs;
  source: Schema<'ReceiptSource'>;
  payments: { paymentMethodId: string; amount: number }[];
}

interface ReceiptFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Ручной продаж: чек с одной или несколькими оплатами (например, частично карткой). */
export function ReceiptFormModal({ open, onOpenChange }: ReceiptFormModalProps) {
  const { message } = App.useApp();
  const create = useCreateReceipt();
  const { data: methods } = useQuery({ ...paymentMethodsQueryOptions(), enabled: open });
  const methodOptions = (methods ?? [])
    .filter((m) => m.isActive)
    .map((m) => ({ value: m.id, label: m.name }));

  // «Сейчас» фиксируем на момент открытия: ProForm не принимает смену initialValues.
  const initialValues = useMemo(
    () => ({
      source: 'web' as const,
      date: toPickerDateTime(inSalonTz(new Date()).toISOString()),
      payments: [{}],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- пересчёт только при открытии
    [open],
  );

  return (
    <ModalForm<FormValues>
      title="Новий чек"
      open={open}
      onOpenChange={onOpenChange}
      width={560}
      // Даты нужны как Dayjs: в API уходят через пояс салона (fromPickerDateTime).
      dateFormatter={false}
      modalProps={{ destroyOnHidden: true }}
      initialValues={initialValues}
      submitter={{ searchConfig: { submitText: 'Створити', resetText: 'Скасувати' } }}
      onFinish={async (v) => {
        try {
          await create.mutateAsync({
            clientName: v.clientName?.trim() ? v.clientName : null,
            date: fromPickerDateTime(v.date),
            source: v.source,
            payments: v.payments,
          });
          message.success('Чек створено');
          return true;
        } catch (error) {
          message.error(errorMessage(error));
          return false;
        }
      }}
    >
      <ProFormText name="clientName" label="Клієнт" placeholder="Необов'язково" />
      <ProFormDateTimePicker
        name="date"
        label="Дата і час"
        fieldProps={{ format: 'DD.MM.YYYY HH:mm', style: { width: '100%' } }}
      />
      <ProFormSelect
        name="source"
        label="Джерело"
        allowClear={false}
        options={toOptions(receiptSourceLabels)}
      />
      <ProFormList
        name="payments"
        label="Оплати"
        min={1}
        creatorButtonProps={{ creatorButtonText: 'Додати оплату' }}
        rules={[
          {
            validator: (_, value?: unknown[]) =>
              value?.length
                ? Promise.resolve()
                : Promise.reject(new Error('Додайте хоча б одну оплату')),
          },
        ]}
      >
        <ProFormSelect
          name="paymentMethodId"
          placeholder="Метод оплати"
          width="sm"
          options={methodOptions}
          rules={[{ required: true, message: 'Оберіть метод' }]}
        />
        <ProFormDigit
          name="amount"
          placeholder="Сума"
          width="xs"
          min={0.01}
          fieldProps={{ suffix: '₴', precision: 2 }}
          rules={[{ required: true, message: 'Сума' }]}
        />
      </ProFormList>
    </ModalForm>
  );
}
