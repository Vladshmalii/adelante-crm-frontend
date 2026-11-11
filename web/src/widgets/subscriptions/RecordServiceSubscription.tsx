import { useQuery } from '@tanstack/react-query';
import { Space, Tag, Typography } from 'antd';

import type { Schema } from '@/shared/api';

import { subscriptionQueryOptions } from './api';
import { formatUnits } from './model';

/**
 * Пометка у услуги записи, оплаченной абонементом (frontend-subscriptions.md, 2.6): тег
 * «Абонемент» и сколько списано. Единица (відв. / хв) — из абонемента; пока он грузится
 * или недоступен — просто число. Мастеру не показываем (решает вызывающий).
 */
export function RecordServiceSubscription({
  service,
}: {
  service: Pick<Schema<'RecordServiceOut'>, 'subscriptionId' | 'subscriptionUnits'>;
}) {
  const subscription = useQuery({
    ...subscriptionQueryOptions(service.subscriptionId ?? ''),
    enabled: !!service.subscriptionId,
    staleTime: 60_000,
  });
  if (!service.subscriptionId) return null;
  const units = service.subscriptionUnits ?? 0;
  const kind = subscription.data?.unitKind;
  return (
    <Space size={4}>
      <Tag color="cyan" style={{ marginInlineEnd: 0 }}>
        Абонемент
      </Tag>
      <Typography.Text type="secondary">
        −{kind ? formatUnits(units, kind) : String(units)}
        {subscription.data && ` · ${subscription.data.name}`}
      </Typography.Text>
    </Space>
  );
}
