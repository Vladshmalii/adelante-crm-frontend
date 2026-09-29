import { ModalForm, ProFormDigit, ProFormList, ProFormSelect } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { App, Typography } from 'antd';

import { errorMessage, type Schema } from '@/shared/api';
import { formatMoney } from '@/shared/lib';

import { usePayRecord } from '../api/calendar.mutations';
import { paymentMethodsQueryOptions } from '../api/calendar.queries';

type RecordItem = Schema<'RecordOut'>;

interface FormValues {
  payments: { paymentMethodId: string; amount: number }[];
}

const sum = (payments: { amount?: number }[] | undefined) =>
  Math.round((payments ?? []).reduce((acc, p) => acc + (p.amount ?? 0), 0) * 100) / 100;

/**
 * Оплата завершённого визита: один или несколько способов, сумма — ровно стоимость записи
 * (частичной оплаты и чаевых нет). Бекенд создаёт чек.
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
  const { data: methods = [] } = useQuery({ ...paymentMethodsQueryOptions(), enabled: !!record });
  const total = record ? Number(record.totalAmount) : 0;

  return (
    <ModalForm<FormValues>
      title={record ? `Оплата візиту: ${record.client.name}` : 'Оплата візиту'}
      open={!!record}
      width={520}
      modalProps={{ destroyOnHidden: true, onCancel: onClose }}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      initialValues={{ payments: [{ amount: total }] }}
      submitter={{ searchConfig: { submitText: 'Оплатити', resetText: 'Скасувати' } }}
      onFinish={async (v) => {
        if (!record) return false;
        try {
          const { receipt } = await pay.mutateAsync({ id: record.id, payments: v.payments });
          message.success(`Оплачено, чек № ${receipt.number}`);
          return true;
        } catch (error) {
          message.error(errorMessage(error));
          return false;
        }
      }}
    >
      <Typography.Paragraph>
        До сплати: <Typography.Text strong>{formatMoney(total)}</Typography.Text>
      </Typography.Paragraph>
      <ProFormList
        name="payments"
        label="Оплати"
        min={1}
        creatorButtonProps={{ creatorButtonText: 'Додати спосіб оплати' }}
        rules={[
          {
            validator: (_, value?: FormValues['payments']) =>
              sum(value) === total
                ? Promise.resolve()
                : Promise.reject(new Error(`Сума оплат має дорівнювати ${formatMoney(total)}`)),
          },
        ]}
      >
        <ProFormSelect
          name="paymentMethodId"
          placeholder="Спосіб оплати"
          width="sm"
          options={methods.map((m) => ({ value: m.id, label: m.name }))}
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
      </ProFormList>
      {!methods.length && (
        <Typography.Text type="warning">
          Немає доступних способів оплати — їх налаштовує суперюзер у «Фінанси → Методи оплат».
        </Typography.Text>
      )}
    </ModalForm>
  );
}
