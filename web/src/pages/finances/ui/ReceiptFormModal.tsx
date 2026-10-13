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
import { App, Select, Spin } from 'antd';
import type { Dayjs } from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';

import { api, errorMessage, type Schema, unwrap } from '@/shared/api';
import {
  formatDateTime,
  formatMoney,
  formatPhone,
  fromPickerDateTime,
  inSalonTz,
  toOptions,
  toPickerDateTime,
  useDebouncedValue,
} from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';
import {
  CheckoutSummary,
  checkPayments,
  methodAvailable,
  methodOptionLabel,
  newOperationKey,
  type PaymentPart,
  PaymentWarnings,
  recordCheckoutQueryOptions,
  saleCheckoutQueryOptions,
} from '@/widgets/loyalty';

import { useCreateReceipt } from '../api/finances.mutations';
import { paymentMethodsQueryOptions, unpaidRecordsQueryOptions } from '../api/finances.queries';
import { receiptSourceLabels } from '../model/labels';

type RecordItem = Schema<'RecordOut'>;

interface FormValues {
  kind: 'sale' | 'visit';
  recordId?: string;
  clientId?: string;
  clientName?: string;
  subtotal?: number;
  date: Dayjs;
  source: Schema<'ReceiptSource'>;
  payments: PaymentPart[];
}

interface ReceiptFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const recordLabel = (r: RecordItem) =>
  `${r.client.name} · ${r.services.map((s) => s.name).join(', ')} · ${formatDateTime(r.startAt)}`;

/**
 * Чек: продажа товаров без записи или оплата завершённого визита (`recordId`). Итог считает
 * сервер (предпросмотр): у продажи — от «Продано» со скидкой клиента или карты, у визита —
 * с бонусными услугами и скидкой. Сумма оплат = итог; способы — как у оплаты визита, включая
 * «Особовий рахунок» (для продажи нужен клиент) и «Кешбек».
 */
export function ReceiptFormModal({ open, onOpenChange }: ReceiptFormModalProps) {
  const { message } = App.useApp();
  const create = useCreateReceipt();
  const formRef = useRef<ProFormInstance<FormValues>>(undefined);
  const [key, setKey] = useState(newOperationKey);
  const [kind, setKind] = useState<FormValues['kind']>('sale');
  const [recordQuery, setRecordQuery] = useState('');
  const [clientQuery, setClientQuery] = useState('');
  const debouncedRecordQuery = useDebouncedValue(recordQuery);
  const debouncedClientQuery = useDebouncedValue(clientQuery);
  const [recordId, setRecordId] = useState<string>();
  const [clientId, setClientId] = useState<string>();
  const [subtotal, setSubtotal] = useState<number>();
  const debouncedSubtotal = useDebouncedValue(subtotal);
  const [bonusIds, setBonusIds] = useState<string[]>([]);
  const [debtConfirmed, setDebtConfirmed] = useState(false);

  const { data: methods = [] } = useQuery({ ...paymentMethodsQueryOptions(), enabled: open });
  const { data: unpaid, isFetching: recordsLoading } = useQuery({
    ...unpaidRecordsQueryOptions(debouncedRecordQuery),
    enabled: open && kind === 'visit',
  });
  const clients = useQuery({
    queryKey: ['clients', 'picker', debouncedClientQuery],
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/api/admin/v1/clients', {
          params: { query: { query: debouncedClientQuery || undefined, perPage: 20 } },
          signal,
        }),
      ).data,
    enabled: open && kind === 'sale',
    staleTime: 30_000,
  });
  const visitCheckout = useQuery({
    ...recordCheckoutQueryOptions(recordId ?? '', bonusIds),
    enabled: open && kind === 'visit' && !!recordId,
  });
  const saleCheckout = useQuery({
    ...saleCheckoutQueryOptions(clientId, debouncedSubtotal ?? 0),
    enabled: open && kind === 'sale' && debouncedSubtotal !== undefined,
  });
  const checkout = kind === 'visit' ? visitCheckout : saleCheckout;
  const preview = kind === 'visit' ? (recordId ? checkout.data : undefined) : checkout.data;
  const total = preview ? Number(preview.total) : undefined;

  // Итог изменился — одна строка оплаты подстраивается под него
  useEffect(() => {
    if (total === undefined) return;
    const parts = formRef.current?.getFieldValue('payments') as PaymentPart[] | undefined;
    if (!parts || parts.length <= 1) {
      formRef.current?.setFieldsValue({
        payments: total > 0 ? [{ ...parts?.[0], amount: total }] : [],
      });
    }
  }, [total]);

  const methodType = (id: string | undefined) => methods.find((m) => m.id === id)?.type;
  const methodOptions = methods
    .filter((m) => m.isActive)
    .filter((m) => m.type !== 'account' || kind === 'visit' || !!clientId)
    .filter((m) => methodAvailable(m, preview))
    .map((m) => ({ value: m.id, label: methodOptionLabel(m, preview) }));

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

  const reset = () => {
    setKind('sale');
    setRecordId(undefined);
    setClientId(undefined);
    setSubtotal(undefined);
    setBonusIds([]);
    setDebtConfirmed(false);
    setRecordQuery('');
    setClientQuery('');
  };

  return (
    <ModalForm<FormValues>
      title="Новий чек"
      open={open}
      onOpenChange={(value) => {
        if (value) setKey(newOperationKey());
        else reset();
        onOpenChange(value);
      }}
      formRef={formRef}
      width={640}
      // Даты нужны как Dayjs: в API уходят через пояс салона (fromPickerDateTime).
      dateFormatter={false}
      modalProps={{ destroyOnHidden: true }}
      initialValues={initialValues}
      submitter={{
        searchConfig: { submitText: 'Створити', resetText: 'Скасувати' },
        submitButtonProps: { disabled: !preview },
      }}
      onFinish={async (v) => {
        if (!preview) return false;
        if (checkPayments(v.payments, methodType, preview).debt > 0 && !debtConfirmed) {
          message.warning('Підтвердіть запис у борг');
          return false;
        }
        const payments = v.payments.map((p) => ({
          paymentMethodId: p.paymentMethodId ?? '',
          amount: p.amount ?? 0,
        }));
        try {
          const isVisit = v.kind === 'visit';
          await create.mutateAsync({
            key,
            body: {
              ...(isVisit
                ? { recordId: v.recordId, bonusRecordServiceIds: bonusIds }
                : {
                    clientId: v.clientId ?? null,
                    clientName: !v.clientId && v.clientName?.trim() ? v.clientName : null,
                    subtotal: v.subtotal ?? 0,
                  }),
              expectedTotal: preview.total,
              date: fromPickerDateTime(v.date),
              source: v.source,
              payments,
            },
          });
          message.success(isVisit ? 'Візит оплачено' : 'Чек створено');
          return true;
        } catch (error) {
          message.error(errorMessage(error));
          void checkout.refetch();
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
          onChange: (e) => {
            setKind(e.target.value as FormValues['kind']);
            setRecordId(undefined);
            setBonusIds([]);
            setDebtConfirmed(false);
            formRef.current?.setFieldsValue({ recordId: undefined, payments: [{}] });
          },
        }}
      />
      {kind === 'visit' ? (
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
            options={(unpaid ?? []).map((r) => ({ value: r.id, label: recordLabel(r) }))}
            onChange={(id: string) => {
              setRecordId(id);
              setBonusIds([]);
            }}
          />
        </ProForm.Item>
      ) : (
        <>
          <ProForm.Item
            name="clientId"
            label="Клієнт"
            tooltip="Для знижки, кешбеку й оплати з рахунку"
          >
            <Select
              allowClear
              showSearch={{ filterOption: false, onSearch: setClientQuery }}
              placeholder="Ім’я, телефон або номер картки"
              loading={clients.isFetching}
              options={(clients.data ?? []).map((c) => ({
                value: c.id,
                label: `${[c.firstName, c.lastName].filter(Boolean).join(' ')} · ${formatPhone(c.phone)}`,
              }))}
              onChange={(id?: string) => {
                setClientId(id);
              }}
            />
          </ProForm.Item>
          <ProFormDependency name={['clientId']}>
            {({ clientId: selected }: { clientId?: string }) =>
              !selected && (
                <ProFormText name="clientName" label="Ім’я покупця" placeholder="Необов'язково" />
              )
            }
          </ProFormDependency>
          <ProFormDigit
            name="subtotal"
            label="Продано"
            tooltip="Сума товарів до знижки"
            min={0}
            fieldProps={{
              suffix: '₴',
              precision: 2,
              onChange: (value) => {
                setSubtotal(value ?? undefined);
              },
            }}
            rules={[{ required: true, message: 'Вкажіть суму' }]}
          />
        </>
      )}
      <QueryErrorAlert error={checkout.error} onRetry={() => void checkout.refetch()} />
      {preview ? (
        <CheckoutSummary
          checkout={preview}
          bonusIds={bonusIds}
          onBonusChange={kind === 'visit' ? setBonusIds : undefined}
        />
      ) : (
        checkout.isFetching && <Spin style={{ display: 'block', marginBottom: 16 }} />
      )}
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
        min={total === 0 ? 0 : 1}
        creatorButtonProps={{ creatorButtonText: 'Додати оплату' }}
        rules={[
          {
            validator: (_, value?: PaymentPart[]) => {
              if (!preview) return Promise.reject(new Error('Дочекайтеся розрахунку суми'));
              const check = checkPayments(value, methodType, preview);
              if (check.difference !== 0) {
                return Promise.reject(
                  new Error(`Сума оплат має дорівнювати ${formatMoney(preview.total)}`),
                );
              }
              if (check.bonusOverLimit) {
                return Promise.reject(
                  new Error(
                    `Кешбеком — не більше ${formatMoney(preview.cashback?.maxPayment ?? 0)}`,
                  ),
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
          width="md"
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
      <ProFormDependency name={['payments']}>
        {({ payments }: { payments?: PaymentPart[] }) =>
          preview && (
            <PaymentWarnings
              check={checkPayments(payments, methodType, preview)}
              debtConfirmed={debtConfirmed}
              onDebtConfirm={setDebtConfirmed}
            />
          )
        }
      </ProFormDependency>
    </ModalForm>
  );
}
