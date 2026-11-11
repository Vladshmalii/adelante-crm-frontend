import { useQuery } from '@tanstack/react-query';
import { Descriptions, Drawer, Result, Space, Spin, Tag, Typography } from 'antd';

import type { Schema } from '@/shared/api';
import { formatDateTime, formatMoney } from '@/shared/lib';

import { subscriptionQueryOptions } from './api';
import { FreezeButton } from './FreezeButton';
import {
  activationModeLabels,
  balanceLabel,
  durationLabel,
  freezeLimitLabel,
  frozenUntilLabel,
  serviceBalances,
  subscriptionStatusLabels,
  validUntilLabel,
} from './model';
import { SubscriptionOperations } from './SubscriptionOperations';

type Subscription = Schema<'SubscriptionOut'>;

/** Тег статуса абонемента. */
export function SubscriptionStatusTag({ status }: { status: Subscription['status'] }) {
  return (
    <Tag color={subscriptionStatusLabels[status].color}>
      {subscriptionStatusLabels[status].text}
    </Tag>
  );
}

/**
 * Карточка абонемента (frontend-subscriptions.md, 2.5): остаток (по услугам при раздельном),
 * сроки, заморозка, где и когда куплен, журнал операций. `canFreeze` — администратор и суперюзер.
 */
export function SubscriptionDetails({
  subscription: s,
  canFreeze,
}: {
  subscription: Subscription;
  canFreeze: boolean;
}) {
  const perService = serviceBalances(s);
  const frozenUntil = frozenUntilLabel(s);
  return (
    <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
      <Descriptions
        column={1}
        bordered
        size="small"
        items={[
          { label: 'Клієнт', children: s.client.name ?? '—' },
          {
            label: 'Статус',
            children: (
              <Space wrap>
                <SubscriptionStatusTag status={s.status} />
                {canFreeze && <FreezeButton subscription={s} size="small" />}
              </Space>
            ),
          },
          {
            label: 'Залишок',
            children: (
              <Space orientation="vertical" size={0}>
                {balanceLabel(s)}
                {perService.map((line) => (
                  <Typography.Text key={line} type="secondary">
                    {line}
                  </Typography.Text>
                ))}
              </Space>
            ),
          },
          ...(s.balanceMode === 'shared'
            ? [
                {
                  label: 'Послуги',
                  children: (
                    <Space orientation="vertical" size={0}>
                      {s.services.map((x) => (
                        <span key={`${x.salonId}:${x.serviceId}`}>
                          {x.serviceName ?? 'Послугу видалено'}
                          {x.salonName && (
                            <Typography.Text type="secondary"> · {x.salonName}</Typography.Text>
                          )}
                        </span>
                      ))}
                    </Space>
                  ),
                },
              ]
            : []),
          { label: 'Діє до', children: validUntilLabel(s) },
          {
            label: 'Термін',
            children: `${durationLabel(s.durationValue, s.durationUnit)} · активація ${activationModeLabels[s.activationMode].toLowerCase()}`,
          },
          ...(s.activatedAt
            ? [{ label: 'Активовано', children: formatDateTime(s.activatedAt) }]
            : []),
          ...(s.freezeAllowed
            ? [
                {
                  label: 'Заморозка',
                  children: frozenUntil
                    ? `Заморожено з ${formatDateTime(s.frozenAt)} ${frozenUntil}`
                    : s.freezeUsed
                      ? `Використано: ${String(s.frozenDays)} дн.${s.unfrozenAt ? `, розморожено ${formatDateTime(s.unfrozenAt)}` : ''}`
                      : `Можна один раз, ${freezeLimitLabel(s.freezeMaxDays)}`,
                },
              ]
            : []),
          {
            label: 'Продано',
            children: `${s.soldSalonName ?? '—'} · ${formatDateTime(s.soldAt)} · ${formatMoney(s.paidAmount)}`,
          },
          ...(s.status === 'cancelled'
            ? [
                {
                  label: 'Анульовано',
                  children: [formatDateTime(s.cancelledAt), s.cancelledByName, s.cancelReason]
                    .filter(Boolean)
                    .join(' · '),
                },
              ]
            : []),
        ]}
      />
      <Typography.Title level={5} style={{ margin: 0 }}>
        Історія
      </Typography.Title>
      <SubscriptionOperations subscription={s} />
    </Space>
  );
}

/** Карточка абонемента в боковой панели — из реестра «Продані абонементи». */
export function SubscriptionDrawer({
  subscriptionId,
  canFreeze,
  onClose,
}: {
  subscriptionId: string | null;
  canFreeze: boolean;
  onClose: () => void;
}) {
  const subscription = useQuery({
    ...subscriptionQueryOptions(subscriptionId ?? ''),
    enabled: !!subscriptionId,
  });
  return (
    <Drawer
      open={!!subscriptionId}
      onClose={onClose}
      size="large"
      title={subscription.data?.name ?? 'Абонемент'}
      destroyOnHidden
    >
      {subscription.isError ? (
        <Result
          status="error"
          title="Не вдалося завантажити абонемент"
          subTitle={subscription.error.message}
        />
      ) : subscription.isPending ? (
        <Spin />
      ) : (
        <SubscriptionDetails subscription={subscription.data} canFreeze={canFreeze} />
      )}
    </Drawer>
  );
}
