import { IdcardOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { Space, Table, Typography } from 'antd';

import type { Schema } from '@/shared/api';
import { QueryErrorAlert } from '@/shared/ui';

import { clientSubscriptionsQueryOptions } from './api';
import { FreezeButton } from './FreezeButton';
import { balanceLabel, frozenUntilLabel, serviceBalances, validUntilLabel } from './model';
import { SubscriptionDetails, SubscriptionStatusTag } from './SubscriptionDetails';

type Subscription = Schema<'SubscriptionOut'>;

/**
 * Карточка клиента → «Абонементи» (администратор и суперюзер; мастеру не показываем —
 * frontend-subscriptions.md, 2.5): название, статус, остаток (по услугам при раздельном), діє до,
 * заморожено до; «Заморозити» / «Розморозити»; в раскрытой строке — карточка с «Історією».
 */
export function ClientSubscriptionsBlock({ clientId }: { clientId: string }) {
  const subscriptions = useQuery(clientSubscriptionsQueryOptions(clientId));
  if (!subscriptions.isPending && !subscriptions.error && !subscriptions.data.length) return null;

  return (
    <ProCard
      title={
        <Space>
          <IdcardOutlined />
          Абонементи
        </Space>
      }
      variant="outlined"
    >
      <QueryErrorAlert error={subscriptions.error} onRetry={() => void subscriptions.refetch()} />
      <Table<Subscription>
        size="small"
        rowKey="id"
        loading={subscriptions.isPending}
        pagination={false}
        dataSource={subscriptions.data}
        scroll={{ x: 'max-content' }}
        expandable={{
          expandedRowRender: (s) => <SubscriptionDetails subscription={s} canFreeze />,
          columnTitle: 'Історія',
        }}
        columns={[
          { title: 'Абонемент', key: 'name', render: (_, s) => s.name },
          {
            title: 'Статус',
            key: 'status',
            render: (_, s) => (
              <Space orientation="vertical" size={0}>
                <SubscriptionStatusTag status={s.status} />
                {frozenUntilLabel(s) && (
                  <Typography.Text type="secondary">
                    заморожено {frozenUntilLabel(s)}
                  </Typography.Text>
                )}
              </Space>
            ),
          },
          {
            title: 'Залишок',
            key: 'balance',
            render: (_, s) => (
              <Space orientation="vertical" size={0}>
                {balanceLabel(s)}
                {serviceBalances(s).map((line) => (
                  <Typography.Text key={line} type="secondary">
                    {line}
                  </Typography.Text>
                ))}
              </Space>
            ),
          },
          { title: 'Діє до', key: 'expires', render: (_, s) => validUntilLabel(s) },
          {
            title: '',
            key: 'actions',
            render: (_, s) => <FreezeButton subscription={s} size="small" />,
          },
        ]}
      />
    </ProCard>
  );
}
