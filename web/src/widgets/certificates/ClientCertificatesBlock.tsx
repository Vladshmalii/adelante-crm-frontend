import { GiftOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { Space, Table, Tag, Typography } from 'antd';

import type { Schema } from '@/shared/api';
import { formatMoney } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import { clientCertificatesQueryOptions } from './api';
import { CertificateHistory } from './CertificateHistory';
import { certificateStatusLabels, certificateValidity } from './model';

type Certificate = Schema<'CertificateOut'>;

/**
 * Карточка клиента → «Сертифікати» (раздел 8, п. 3): купленные им и свои (активированные на
 * него) — код, остаток, срок, статус; история погашений — в раскрытой строке.
 */
export function ClientCertificatesBlock({ clientId }: { clientId: string }) {
  const certificates = useQuery(clientCertificatesQueryOptions(clientId));
  if (!certificates.isPending && !certificates.error && !certificates.data.length) return null;

  return (
    <ProCard
      title={
        <Space>
          <GiftOutlined />
          Сертифікати
        </Space>
      }
      variant="outlined"
    >
      <QueryErrorAlert error={certificates.error} onRetry={() => void certificates.refetch()} />
      <Table<Certificate>
        size="small"
        rowKey="id"
        loading={certificates.isPending}
        pagination={false}
        dataSource={certificates.data}
        scroll={{ x: 'max-content' }}
        expandable={{
          expandedRowRender: (c) => <CertificateHistory certificateId={c.id} />,
        }}
        columns={[
          {
            title: 'Сертифікат',
            key: 'name',
            render: (_, c) => (
              <Space orientation="vertical" size={0}>
                {c.name}
                <Typography.Text type="secondary">
                  {c.owner?.id === clientId
                    ? c.buyer?.id === clientId
                      ? 'Купив для себе'
                      : `Власний${c.buyer?.name ? ` · подарував ${c.buyer.name}` : ''}`
                    : `Купив${c.owner?.name ? ` · власник ${c.owner.name}` : ' · не активований'}`}
                </Typography.Text>
              </Space>
            ),
          },
          {
            title: 'Код',
            key: 'code',
            render: (_, c) => (
              <Typography.Text code copyable={{ text: c.code }}>
                {c.code}
              </Typography.Text>
            ),
          },
          {
            title: 'Залишок',
            key: 'balance',
            align: 'right',
            render: (_, c) => `${formatMoney(c.balance)} з ${formatMoney(c.amount)}`,
          },
          {
            title: 'Термін',
            key: 'expires',
            render: (_, c) => certificateValidity(c.expiresAt),
          },
          {
            title: 'Статус',
            key: 'status',
            render: (_, c) => (
              <Tag color={certificateStatusLabels[c.status].color}>
                {certificateStatusLabels[c.status].text}
              </Tag>
            ),
          },
        ]}
      />
    </ProCard>
  );
}
