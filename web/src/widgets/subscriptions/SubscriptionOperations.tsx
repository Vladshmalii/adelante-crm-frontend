import { useQuery } from '@tanstack/react-query';
import { Table, Tag, Typography } from 'antd';

import type { Schema } from '@/shared/api';
import { formatDateTime } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import { subscriptionOperationsQueryOptions } from './api';
import { formatUnits, operationTypeLabels } from './model';

type Operation = Schema<'SubscriptionOperationOut'>;

/**
 * «Історія» абонемента — журнал операций, новые сверху: продажа, списания, сторно, сгорание,
 * аннулирование. Заморозка в журнал не пишется (она в аудите) — видна в карточке.
 */
export function SubscriptionOperations({
  subscription,
}: {
  subscription: Pick<Schema<'SubscriptionOut'>, 'id' | 'unitKind' | 'balanceMode' | 'services'>;
}) {
  const operations = useQuery(subscriptionOperationsQueryOptions(subscription.id));
  const serviceName = (op: Operation) => {
    if (subscription.balanceMode !== 'separate' || !op.basketServiceId) return null;
    const s = subscription.services.find(
      (x) => x.salonId === op.basketSalonId && x.serviceId === op.basketServiceId,
    );
    return s?.serviceName ?? 'Послугу видалено';
  };

  return (
    <>
      <QueryErrorAlert error={operations.error} onRetry={() => void operations.refetch()} />
      <Table<Operation>
        size="small"
        rowKey="id"
        loading={operations.isPending}
        pagination={false}
        dataSource={operations.data}
        scroll={{ x: 'max-content' }}
        columns={[
          { title: 'Дата', key: 'date', render: (_, o) => formatDateTime(o.createdAt) },
          {
            title: 'Операція',
            key: 'type',
            render: (_, o) => (
              <Tag color={operationTypeLabels[o.type].color}>
                {operationTypeLabels[o.type].text}
              </Tag>
            ),
          },
          {
            title: 'Зміна',
            key: 'delta',
            align: 'right',
            render: (_, o) =>
              `${o.delta > 0 ? '+' : o.delta < 0 ? '−' : ''}${formatUnits(Math.abs(o.delta), subscription.unitKind)}`,
          },
          {
            title: 'Залишок',
            key: 'balance',
            align: 'right',
            render: (_, o) => (
              <>
                {o.balanceAfter}
                {serviceName(o) && (
                  <Typography.Text type="secondary"> · {serviceName(o)}</Typography.Text>
                )}
              </>
            ),
          },
          { title: 'Салон', key: 'salon', render: (_, o) => o.salonName ?? '—' },
          {
            title: 'Коментар',
            key: 'comment',
            render: (_, o) => (
              <Typography.Text type="secondary">
                {[o.comment, o.authorName].filter(Boolean).join(' · ') || '—'}
              </Typography.Text>
            ),
          },
        ]}
      />
    </>
  );
}
