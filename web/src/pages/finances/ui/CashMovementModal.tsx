import {
  ModalForm,
  ProForm,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { App } from 'antd';
import type { Dayjs } from 'dayjs';
import { useMemo } from 'react';

import { errorMessage } from '@/shared/api';
import { formatMoney, fromPickerDateTime, inSalonTz, toPickerDateTime } from '@/shared/lib';

import { useCreateOperation } from '../api/finances.mutations';
import { cashRegistersQueryOptions } from '../api/finances.queries';
import { ExpenseCategorySelect } from './ExpenseCategorySelect';

export type CashMovementKind = 'expense' | 'transfer';

interface FormValues {
  cashRegisterId: string;
  targetCashRegisterId?: string;
  category?: string;
  amount: number;
  date: Dayjs;
  description?: string;
}

interface CashMovementModalProps {
  /** null — модалка закрыта. */
  movement: { kind: CashMovementKind; cashRegisterId: string } | null;
  onClose: () => void;
}

const TITLES: Record<CashMovementKind, string> = {
  expense: 'Витрата з каси',
  transfer: 'Переказ між касами',
};

/** Витрата или переказ из конкретной кассы (кнопки на карточке кассы). */
export function CashMovementModal({ movement, onClose }: CashMovementModalProps) {
  const { message } = App.useApp();
  const create = useCreateOperation();
  const open = movement !== null;
  const { data: registers } = useQuery({ ...cashRegistersQueryOptions(), enabled: open });
  const active = (registers ?? []).filter((r) => r.isActive);
  const options = active.map((r) => ({
    value: r.id,
    label: `${r.name} · ${formatMoney(r.balance)}`,
  }));

  const initialValues = useMemo(
    () => ({
      cashRegisterId: movement?.cashRegisterId,
      date: toPickerDateTime(inSalonTz(new Date()).toISOString()),
    }),
    [movement],
  );

  if (!movement) return null;
  const isTransfer = movement.kind === 'transfer';

  return (
    <ModalForm<FormValues>
      title={TITLES[movement.kind]}
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      width={520}
      dateFormatter={false}
      modalProps={{ destroyOnHidden: true }}
      initialValues={initialValues}
      submitter={{ searchConfig: { submitText: 'Провести', resetText: 'Скасувати' } }}
      onFinish={async (v) => {
        try {
          await create.mutateAsync({
            type: movement.kind,
            amount: v.amount,
            date: fromPickerDateTime(v.date),
            cashRegisterId: v.cashRegisterId,
            targetCashRegisterId: isTransfer ? (v.targetCashRegisterId ?? null) : null,
            category: isTransfer ? null : (v.category ?? null),
            description: v.description?.trim() ? v.description : null,
          });
          message.success(isTransfer ? 'Переказ проведено' : 'Витрату проведено');
          return true;
        } catch (error) {
          message.error(errorMessage(error));
          return false;
        }
      }}
    >
      <ProFormSelect
        name="cashRegisterId"
        label={isTransfer ? 'З каси' : 'Каса'}
        allowClear={false}
        options={options}
        rules={[{ required: true, message: 'Оберіть касу' }]}
      />
      {isTransfer ? (
        <ProFormSelect
          name="targetCashRegisterId"
          label="До каси"
          dependencies={['cashRegisterId']}
          options={options}
          rules={[
            { required: true, message: 'Оберіть касу-отримувача' },
            ({ getFieldValue }) => ({
              validator: (_, value?: string) =>
                value && value === getFieldValue('cashRegisterId')
                  ? Promise.reject(new Error('Каси мають відрізнятися'))
                  : Promise.resolve(),
            }),
          ]}
        />
      ) : (
        <ProForm.Item
          name="category"
          label="Тип витрати"
          rules={[{ required: true, message: 'Оберіть тип витрати' }]}
        >
          <ExpenseCategorySelect />
        </ProForm.Item>
      )}
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
      <ProFormTextArea name="description" label="Коментар" />
    </ModalForm>
  );
}
