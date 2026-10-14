import { ModalForm, ProFormTextArea } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { App, Table, Tag, Typography } from 'antd';

import { errorMessage, type Schema } from '@/shared/api';
import { meQueryOptions } from '@/shared/auth';
import { formatDateTime, formatMoney } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import { certificateHistoryQueryOptions, useCancelCertificate } from './api';

type Txn = Schema<'CertificateTransactionOut'>;

const txnLabels: Record<Schema<'TransactionType'>, { text: string; color: string }> = {
  topup: { text: 'Продаж', color: 'green' },
  payment: { text: 'Оплата', color: 'blue' },
  reversal: { text: 'Сторно', color: 'default' },
  burn: { text: 'Згоряння', color: 'orange' },
  adjustment: { text: 'Анулювання', color: 'red' },
  refund: { text: 'Повернення', color: 'default' },
  accrual: { text: 'Нарахування', color: 'default' },
};

/** История сертификата (раздел 8, п. 3): где и когда продан, погашался, сгорел, аннулирован. */
export function CertificateHistory({ certificateId }: { certificateId: string }) {
  const history = useQuery(certificateHistoryQueryOptions(certificateId));
  const me = useQuery(meQueryOptions);
  const salonName = (id: string | null) =>
    id ? (me.data?.salons.find((s) => s.id === id)?.name ?? '—') : '—';

  return (
    <>
      <QueryErrorAlert error={history.error} onRetry={() => void history.refetch()} />
      <Table<Txn>
        size="small"
        rowKey="id"
        loading={history.isPending}
        pagination={false}
        dataSource={history.data}
        columns={[
          { title: 'Дата', key: 'date', render: (_, t) => formatDateTime(t.createdAt) },
          {
            title: 'Операція',
            key: 'type',
            render: (_, t) => <Tag color={txnLabels[t.type].color}>{txnLabels[t.type].text}</Tag>,
          },
          {
            title: 'Сума',
            key: 'amount',
            align: 'right',
            render: (_, t) => formatMoney(t.amount),
          },
          {
            title: 'Залишок',
            key: 'balance',
            align: 'right',
            render: (_, t) => formatMoney(t.balanceAfter),
          },
          { title: 'Салон', key: 'salon', render: (_, t) => salonName(t.salonId) },
          {
            title: 'Коментар',
            key: 'comment',
            render: (_, t) => (
              <Typography.Text type="secondary">
                {[t.comment, t.authorName].filter(Boolean).join(' · ') || '—'}
              </Typography.Text>
            ),
          },
        ]}
      />
    </>
  );
}

/** Аннулирование суперюзером: с причиной, остаток в ноль, деньги не возвращаются. */
export function CancelCertificateModal({
  certificate,
  onClose,
}: {
  certificate: Schema<'CertificateOut'> | null;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const cancel = useCancelCertificate();
  return (
    <ModalForm<{ reason: string }>
      title={certificate ? `Анулювати сертифікат ${certificate.code}` : 'Анулювати сертифікат'}
      open={!!certificate}
      width={480}
      modalProps={{ destroyOnHidden: true, onCancel: onClose }}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      submitter={{
        searchConfig: { submitText: 'Анулювати', resetText: 'Скасувати' },
        submitButtonProps: { danger: true },
      }}
      onFinish={async ({ reason }) => {
        if (!certificate) return false;
        try {
          await cancel.mutateAsync({ id: certificate.id, reason });
          message.success('Сертифікат анульовано');
          return true;
        } catch (error) {
          message.error(errorMessage(error));
          return false;
        }
      }}
    >
      <Typography.Paragraph type="secondary">
        Залишок {certificate ? formatMoney(certificate.balance) : ''} буде списано в нуль. Гроші
        покупцю не повертаються.
      </Typography.Paragraph>
      <ProFormTextArea
        name="reason"
        label="Причина"
        rules={[{ required: true, whitespace: true, message: 'Вкажіть причину' }]}
      />
    </ModalForm>
  );
}
