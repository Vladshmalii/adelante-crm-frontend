import { App, Button, Popconfirm, Tooltip } from 'antd';

import { errorMessage, type Schema } from '@/shared/api';

import { useFreezeSubscription } from './api';
import { freezeLimitLabel, freezeState } from './model';

/**
 * «Заморозити» / «Розморозити» с подтверждением (subscriptions.md, раздел 7): заморозка один
 * раз, лимит дней из типа; разморозка в любой момент, срок продлевается на фактические дни.
 * Отказ сервера — 409 текстом бекенда. Права (администратор, суперюзер) проверяет вызывающий.
 */
export function FreezeButton({
  subscription,
  size,
}: {
  subscription: Schema<'SubscriptionOut'>;
  size?: 'small' | 'middle';
}) {
  const { message } = App.useApp();
  const freeze = useFreezeSubscription();
  const state = freezeState(subscription);
  if (!state) return null;
  const isFreeze = state.action === 'freeze';
  const label = isFreeze ? 'Заморозити' : 'Розморозити';

  if (state.disabledReason) {
    return (
      <Tooltip title={state.disabledReason}>
        <Button size={size} disabled>
          {label}
        </Button>
      </Tooltip>
    );
  }

  return (
    <Popconfirm
      title={
        isFreeze ? `Заморозити «${subscription.name}»?` : `Розморозити «${subscription.name}»?`
      }
      description={
        isFreeze
          ? `Заморозити можна лише один раз, ${freezeLimitLabel(subscription.freezeMaxDays)}. Термін дії продовжиться на дні заморозки.`
          : 'Термін дії продовжиться на фактичні дні заморозки.'
      }
      okText={label}
      cancelText="Скасувати"
      onConfirm={() =>
        freeze.mutateAsync({ id: subscription.id, action: state.action }).then(
          () => void message.success(isFreeze ? 'Абонемент заморожено' : 'Абонемент розморожено'),
          (e: unknown) => void message.error(errorMessage(e)),
        )
      }
    >
      <Button size={size} loading={freeze.isPending}>
        {label}
      </Button>
    </Popconfirm>
  );
}
