import {
  ModalForm,
  ProForm,
  ProFormDependency,
  ProFormDigit,
  ProFormList,
  ProFormSelect,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { App, Spin, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { formatMoney } from '@/shared/lib';
import { useSessionStore } from '@/shared/session';
import { QueryErrorAlert } from '@/shared/ui';
import {
  CertificateCodeField,
  CertificateSalePicker,
  type CertificateSaleItem,
  SoldCertificatesModal,
  templateIdsOf,
} from '@/widgets/certificates';
import {
  CheckoutSummary,
  checkPayments,
  methodAvailable,
  methodOptionLabel,
  newOperationKey,
  type PaymentPart,
  PaymentWarnings,
  recordCheckoutQueryOptions,
} from '@/widgets/loyalty';
import {
  clientSubscriptionsQueryOptions,
  type SubscriptionSaleItem,
  SubscriptionSalePicker,
  setUse,
  subscriptionsBody,
  subscriptionTypeIdsOf,
  type SubscriptionUse,
  SubscriptionUseSelect,
  subscriptionUsesParams,
  type VisitLine,
} from '@/widgets/subscriptions';
import {
  ProductSalePicker,
  type ProductSaleItem,
  productsBody,
  useDebouncedProductParams,
} from '@/widgets/product-sale';

import { usePayRecord } from '../api/calendar.mutations';
import { paymentMethodsQueryOptions } from '../api/calendar.queries';

type RecordItem = Schema<'RecordOut'>;

interface FormValues {
  payments: PaymentPart[];
}

/**
 * Оплата завершённого визита (раздел 6 спецификации лояльности): предпросмотр сервера —
 * «Продано», бонусные услуги (чекбоксы у строк), скидка с источником, итог; один или несколько
 * способов, сумма — ровно итог. Недоплата закрывается частью «Особовий рахунок» (в долг —
 * с подтверждением), кешбэк — в пределах максимума чека. «+ Товар» — продажа со склада в том же
 * чеке, «+ Сертифікат» — подарочных сертификатов (после оплаты — окно с кодами), «+ Абонемент» —
 * абонемент клиенту визита (subscriptions.md, раздел 5). У строки услуги, которую покрывает
 * абонемент клиента, — «Оплатити абонементом» (раздел 6): строка идёт по 0 ₴ и списывает
 * посещение или минуты; отказ (остаток, заморозка, срок) — 422 текстом бекенда.
 */
export function PaymentModal({
  record,
  onClose,
}: {
  record: RecordItem | null;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const pay = usePayRecord();
  const formRef = useRef<ProFormInstance<FormValues>>(undefined);
  const [bonusIds, setBonusIds] = useState<string[]>([]);
  const [debtConfirmed, setDebtConfirmed] = useState(false);
  const [certificates, setCertificates] = useState<CertificateSaleItem[]>([]);
  const [products, setProducts] = useState<ProductSaleItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionSaleItem[]>([]);
  const [uses, setUses] = useState<SubscriptionUse[]>([]);
  const salonId = useSessionStore((s) => s.salonId);
  const clientSubscriptions = useQuery({
    ...clientSubscriptionsQueryOptions(record?.client.id ?? '', salonId ?? undefined),
    enabled: !!record && !!salonId,
  });
  const visitLines: VisitLine[] = (record?.services ?? []).flatMap((s) =>
    s.recordServiceId
      ? [
          {
            recordServiceId: s.recordServiceId,
            serviceId: s.id,
            durationMinutes: s.durationMinutes,
          },
        ]
      : [],
  );
  const productParams = useDebouncedProductParams(products);
  const [sold, setSold] = useState<{ receiptId: string; client: { id: string; name: string } }>();
  const [key, setKey] = useState(newOperationKey);
  const { data: methods = [] } = useQuery({ ...paymentMethodsQueryOptions(), enabled: !!record });
  const checkout = useQuery({
    ...recordCheckoutQueryOptions(
      record?.id ?? '',
      bonusIds,
      templateIdsOf(certificates),
      productParams,
      subscriptionTypeIdsOf(subscriptions),
      subscriptionUsesParams(uses),
    ),
    enabled: !!record,
  });
  const preview = checkout.data;
  const total = preview ? Number(preview.total) : undefined;

  // Итог изменился (отметили бонусную услугу) — одна строка оплаты подстраивается под него
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
  const reset = () => {
    setBonusIds([]);
    setDebtConfirmed(false);
    setCertificates([]);
    setProducts([]);
    setSubscriptions([]);
    setUses([]);
  };
  // Строка — либо бонусная, либо по абонементу (иначе 422)
  const changeBonus = (ids: string[]) => {
    setBonusIds(ids);
    setUses((prev) => prev.filter((u) => !ids.includes(u.recordServiceId)));
  };
  const changeUse = (recordServiceId: string, subscriptionId: string | undefined) => {
    setUses((prev) => setUse(prev, recordServiceId, subscriptionId));
    if (subscriptionId) setBonusIds((prev) => prev.filter((id) => id !== recordServiceId));
  };

  return (
    <>
      <ModalForm<FormValues>
        title={record ? `Оплата візиту: ${record.client.name}` : 'Оплата візиту'}
        open={!!record}
        width={620}
        formRef={formRef}
        modalProps={{ destroyOnHidden: true, onCancel: onClose }}
        onOpenChange={(open) => {
          if (open) setKey(newOperationKey());
          else {
            reset();
            onClose();
          }
        }}
        initialValues={{ payments: [{}] }}
        submitter={{
          searchConfig: { submitText: 'Оплатити', resetText: 'Скасувати' },
          // Предпросмотр с ошибкой (422 по абонементу или сертификату) — оплатить нельзя
          submitButtonProps: { disabled: !preview || checkout.isError },
        }}
        onFinish={async (v) => {
          if (!record || !preview) return false;
          const check = checkPayments(v.payments, methodType, preview);
          if (check.debt > 0 && !debtConfirmed) {
            message.warning('Підтвердіть запис у борг');
            return false;
          }
          try {
            const { receipt } = await pay.mutateAsync({
              id: record.id,
              key,
              body: {
                payments: v.payments.map((p) => ({
                  paymentMethodId: p.paymentMethodId ?? '',
                  amount: p.amount ?? 0,
                  certificateCode:
                    methodType(p.paymentMethodId) === 'certificate' ? p.certificateCode : null,
                })),
                bonusRecordServiceIds: bonusIds,
                expectedTotal: preview.total,
                certificates,
                products: productsBody(products),
                subscriptions: subscriptionsBody(subscriptions),
                subscriptionUses: uses,
              },
            });
            message.success(`Оплачено, чек № ${receipt.number}`);
            if (certificates.length) {
              setSold({
                receiptId: receipt.id,
                client: { id: record.client.id, name: record.client.name },
              });
            }
            reset();
            return true;
          } catch (error) {
            message.error(errorMessage(error));
            // Предпросмотр мог устареть (409) или списание отклонено (422) — перезапрашиваем
            void checkout.refetch();
            return false;
          }
        }}
      >
        <QueryErrorAlert error={checkout.error} onRetry={() => void checkout.refetch()} />
        <ProductSalePicker value={products} onChange={setProducts} />
        <CertificateSalePicker value={certificates} onChange={setCertificates} />
        <SubscriptionSalePicker value={subscriptions} onChange={setSubscriptions} />
        {preview ? (
          <CheckoutSummary
            checkout={preview}
            bonusIds={bonusIds}
            onBonusChange={changeBonus}
            lineExtra={
              salonId && clientSubscriptions.data?.length
                ? (line) =>
                    line.recordServiceId && (
                      <SubscriptionUseSelect
                        line={line}
                        subscriptions={clientSubscriptions.data}
                        salonId={salonId}
                        uses={uses}
                        lines={visitLines}
                        onChange={(id) => {
                          if (line.recordServiceId) changeUse(line.recordServiceId, id);
                        }}
                      />
                    )
                : undefined
            }
          />
        ) : (
          !checkout.isError && <Spin style={{ display: 'block', marginBottom: 16 }} />
        )}
        <ProFormList
          name="payments"
          label="Оплати"
          min={total === 0 ? 0 : 1}
          creatorButtonProps={{ creatorButtonText: 'Додати спосіб оплати' }}
          rules={[
            {
              validator: (_, value?: PaymentPart[]) => {
                if (!preview) return Promise.resolve();
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
                if (check.certificatesNotByRegister) {
                  return Promise.reject(new Error('Сертифікати — лише касовими способами'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <ProFormSelect
            name="paymentMethodId"
            placeholder="Спосіб оплати"
            width="md"
            options={methods
              .filter((m) => methodAvailable(m, preview))
              .map((m) => ({ value: m.id, label: methodOptionLabel(m, preview) }))}
            rules={[{ required: true, message: 'Оберіть спосіб' }]}
          />
          <ProFormDigit
            name="amount"
            placeholder="Сума"
            width="xs"
            min={0.01}
            fieldProps={{ suffix: '₴', precision: 2 }}
            rules={[{ required: true, message: 'Сума' }]}
          />
          <ProFormDependency name={['paymentMethodId']}>
            {({ paymentMethodId }: { paymentMethodId?: string }) =>
              methodType(paymentMethodId) === 'certificate' && (
                <ProForm.Item
                  name="certificateCode"
                  rules={[{ required: true, message: 'Код сертифіката' }]}
                >
                  <CertificateCodeField
                    context={{
                      recordId: record?.id,
                      bonusRecordServiceIds: bonusIds,
                      subscriptionRecordServiceIds: uses.map((u) => u.recordServiceId),
                      clientId: record?.client.id,
                      products: productsBody(products),
                    }}
                  />
                </ProForm.Item>
              )
            }
          </ProFormDependency>
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
        {!methods.length && (
          <Typography.Text type="warning">
            Немає доступних способів оплати — їх налаштовує суперюзер у «Фінанси → Методи оплат».
          </Typography.Text>
        )}
      </ModalForm>
      <SoldCertificatesModal
        receiptId={sold?.receiptId ?? null}
        client={sold?.client}
        onClose={() => {
          setSold(undefined);
        }}
      />
    </>
  );
}
