import { PrinterOutlined, UserAddOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, App, Button, Modal, Space, Table, Tag, Typography } from 'antd';

import { errorMessage, type Schema } from '@/shared/api';
import { formatMoney } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import { receiptCertificatesQueryOptions, useActivateCertificate } from './api';
import { certificateValidity, printCertificates } from './model';

type Certificate = Schema<'CertificateOut'>;

/**
 * После оплаты — коды проданных сертификатов (certificates.md, 4.5): скопировать, распечатать
 * бланк, активировать на клиента чека. Без активации сертификат «на предъявителя» —
 * привяжется к тому, кто первым его предъявит (решение 6).
 */
export function SoldCertificatesModal({
  receiptId,
  client,
  onClose,
}: {
  receiptId: string | null;
  /** Клиент чека — ему можно активировать сертификат «на себя». */
  client?: { id: string; name: string } | null;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const certificates = useQuery({
    ...receiptCertificatesQueryOptions(receiptId ?? ''),
    enabled: !!receiptId,
  });
  const activate = useActivateCertificate();
  const items = certificates.data ?? [];

  const print = (list: Certificate[]) => {
    if (!printCertificates(list)) message.warning('Браузер заблокував вікно друку');
  };

  return (
    <Modal
      title="Продані сертифікати"
      open={!!receiptId}
      width={720}
      onCancel={onClose}
      destroyOnHidden
      footer={[
        <Button
          key="print"
          icon={<PrinterOutlined />}
          disabled={!items.length}
          onClick={() => {
            print(items);
          }}
        >
          Друк усіх
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Готово
        </Button>,
      ]}
    >
      <QueryErrorAlert error={certificates.error} onRetry={() => void certificates.refetch()} />
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        title="Код — це гроші: передайте його лише покупцю"
        description="Не активований сертифікат прив’яжеться до того, хто першим ним розрахується. Активований передати не можна."
      />
      <Table<Certificate>
        size="small"
        rowKey="id"
        loading={certificates.isPending}
        pagination={false}
        dataSource={items}
        scroll={{ x: 'max-content' }}
        columns={[
          {
            title: 'Сертифікат',
            key: 'name',
            render: (_, c) => (
              <Space orientation="vertical" size={0}>
                {c.name}
                <Typography.Text type="secondary">
                  {formatMoney(c.amount)} · {certificateValidity(c.expiresAt)}
                </Typography.Text>
              </Space>
            ),
          },
          {
            title: 'Код',
            key: 'code',
            render: (_, c) => (
              <Typography.Text
                code
                copyable={{ text: c.code, tooltips: ['Скопіювати', 'Скопійовано'] }}
              >
                {c.code}
              </Typography.Text>
            ),
          },
          {
            title: '',
            key: 'actions',
            render: (_, c) => (
              <Space>
                <Button
                  size="small"
                  icon={<PrinterOutlined />}
                  aria-label={`Друк ${c.code}`}
                  onClick={() => {
                    print([c]);
                  }}
                />
                {c.owner ? (
                  <Tag color="green">Активовано: {c.owner.name}</Tag>
                ) : (
                  client && (
                    <Button
                      size="small"
                      icon={<UserAddOutlined />}
                      loading={activate.isPending && activate.variables.id === c.id}
                      onClick={() => {
                        activate.mutate(
                          { id: c.id, clientId: client.id },
                          {
                            onSuccess: () => {
                              message.success(`Сертифікат активовано на ${client.name}`);
                            },
                            onError: (error) => {
                              message.error(errorMessage(error));
                            },
                          },
                        );
                      }}
                    >
                      Активувати на {client.name}
                    </Button>
                  )
                )}
              </Space>
            ),
          },
        ]}
      />
    </Modal>
  );
}
