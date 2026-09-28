import {
  ModalForm,
  ProForm,
  ProFormDateTimePicker,
  ProFormDependency,
  ProFormDigit,
  ProFormList,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { App, Select, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import { useMemo, useRef, useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import {
  formatDateTime,
  formatMoney,
  fromPickerDateTime,
  inSalonTz,
  toOptions,
  toPickerDateTime,
  useDebouncedValue,
} from '@/shared/lib';

import { useCreateReceipt } from '../api/finances.mutations';
import { paymentMethodsQueryOptions, unpaidRecordsQueryOptions } from '../api/finances.queries';
import { receiptSourceLabels } from '../model/labels';

type RecordItem = Schema<'RecordOut'>;

interface FormValues {
  kind: 'sale' | 'visit';
  recordId?: string;
  clientName?: string;
  date: Dayjs;
  source: Schema<'ReceiptSource'>;
  payments: { paymentMethodId: string; amount: number }[];
}

interface ReceiptFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Сумма оплат; у ещё не заполненной строки суммы нет. */
const sum = (payments: { amount?: number }[] | undefined) =>
  Math.round((payments ?? []).reduce((acc, p) => acc + (p.amount ?? 0), 0) * 100) / 100;

const recordLabel = (r: RecordItem) =>
  `${r.client.name} · ${r.services.map((s) => s.name).join(', ')} · ${formatDateTime(r.startAt)}`;

/**
 * Чек: ручной продаж или оплата завершённого визита (`recordId`). Для визита сумма оплат должна
 * равняться сумме записи — иначе бекенд ответит 409; клиента бекенд берёт из записи.
 */
export function ReceiptFormModal({ open, onOpenChange }: ReceiptFormModalProps) {
  const { message } = App.useApp();
  const create = useCreateReceipt();
  const formRef = useRef<ProFormInstance<FormValues>>(undefined);
  const [recordQuery, setRecordQuery] = useState('');
  const debouncedQuery = useDebouncedValue(recordQuery);
  const [selected, setSelected] = useState<RecordItem | null>(null);

  const { data: methods } = useQuery({ ...paymentMethodsQueryOptions(), enabled: open });
  const { data: unpaid, isFetching: recordsLoading } = useQuery({
    ...unpaidRecordsQueryOptions(debouncedQuery),
    enabled: open,
  });
  const methodOptions = (methods ?? [])
    .filter((m) => m.isActive)
    .map((m) => ({ value: m.id, label: m.name }));

  // «Сейчас» фиксируем на момент открытия: ProForm не принимает смену initialValues.
  const initialValues = useMemo(
    () => ({
      kind: 'sale' as const,
      source: 'web' as const,
      date: toPickerDateTime(inSalonTz(new Date()).toISOString()),
      payments: [{}],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- пересчёт только при открытии
    [open],
  );

  const selectRecord = (record: RecordItem | null) => {
    setSelected(record);
    // Полная сумма визита — одной оплатой; при необходимости её можно разбить на несколько.
    formRef.current?.setFieldsValue({
      recordId: record?.id,
      payments: [
        { amount: record ? Number(record.totalAmount) : undefined },
      ] as FormValues['payments'],
    });
  };

  return (
    <ModalForm<FormValues>
      title="Новий чек"
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          setSelected(null);
          setRecordQuery('');
        }
        onOpenChange(value);
      }}
      formRef={formRef}
      width={600}
      // Даты нужны как Dayjs: в API уходят через пояс салона (fromPickerDateTime).
      dateFormatter={false}
      modalProps={{ destroyOnHidden: true }}
      initialValues={initialValues}
      submitter={{ searchConfig: { submitText: 'Створити', resetText: 'Скасувати' } }}
      onFinish={async (v) => {
        try {
          const isVisit = v.kind === 'visit';
          await create.mutateAsync({
            ...(isVisit
              ? { recordId: v.recordId }
              : { clientName: v.clientName?.trim() ? v.clientName : null }),
            date: fromPickerDateTime(v.date),
            source: v.source,
            payments: v.payments,
          });
          message.success(isVisit ? 'Візит оплачено' : 'Чек створено');
          return true;
        } catch (error) {
          message.error(errorMessage(error));
          return false;
        }
      }}
    >
      <ProFormRadio.Group
        name="kind"
        radioType="button"
        options={[
          { value: 'sale', label: 'Продаж' },
          { value: 'visit', label: 'Оплата візиту' },
        ]}
        fieldProps={{
          onChange: () => {
            selectRecord(null);
          },
        }}
      />
      <ProFormDependency name={['kind']}>
        {(values: Record<string, unknown>) =>
          values.kind === 'visit' ? (
            <ProForm.Item
              name="recordId"
              label="Візит"
              tooltip="Завершені й неоплачені візити"
              rules={[{ required: true, message: 'Оберіть візит' }]}
            >
              <Select
                showSearch={{ filterOption: false, onSearch: setRecordQuery }}
                placeholder="Клієнт: ім’я або телефон"
                loading={recordsLoading}
                notFoundContent={recordsLoading ? 'Шукаємо…' : 'Неоплачених візитів немає'}
                options={(unpaid ?? []).map((r) => ({
                  value: r.id,
                  label: `${recordLabel(r)} · ${formatMoney(r.totalAmount)}`,
                }))}
                onChange={(id: string) => {
                  selectRecord(unpaid?.find((r) => r.id === id) ?? null);
                }}
              />
            </ProForm.Item>
          ) : (
            <ProFormText name="clientName" label="Клієнт" placeholder="Необов'язково" />
          )
        }
      </ProFormDependency>
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
            validator: (_, value?: FormValues['payments']) => {
              if (!value?.length) return Promise.reject(new Error('Додайте хоча б одну оплату'));
              if (selected && sum(value) !== Number(selected.totalAmount)) {
                return Promise.reject(
                  new Error(`Сума оплат має дорівнювати ${formatMoney(selected.totalAmount)}`),
                );
              }
              return Promise.resolve();
            },
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
      {selected && (
        <Typography.Text type="secondary">
          До сплати за візит: {formatMoney(selected.totalAmount)}
        </Typography.Text>
      )}
    </ModalForm>
  );
}
