import { Select, Space, Typography } from 'antd';

import type { Schema } from '@/shared/api';

import {
  formatUnits,
  type SubscriptionUse,
  usableForLine,
  validUntilLabel,
  type VisitLine,
} from './model';

type Subscription = Schema<'SubscriptionOut'>;

/**
 * «Оплатити абонементом» у строки услуги в окне оплаты визита (subscriptions.md, раздел 6,
 * решение 12): подходящие абонементы клиента — название, остаток, діє до. Выбор вручную,
 * по умолчанию не выбран. Нет подходящих и ничего не выбрано — ничего не показываем.
 */
export function SubscriptionUseSelect({
  line,
  subscriptions,
  salonId,
  uses,
  lines,
  onChange,
}: {
  /** Строка предпросмотра: `subscriptionUnits` — сколько спишет сервер. */
  line: Pick<Schema<'CheckoutLineOut'>, 'recordServiceId' | 'subscriptionId' | 'subscriptionUnits'>;
  subscriptions: readonly Subscription[];
  salonId: string;
  uses: readonly SubscriptionUse[];
  lines: readonly VisitLine[];
  onChange: (subscriptionId: string | undefined) => void;
}) {
  const visit = lines.find((l) => l.recordServiceId === line.recordServiceId);
  if (!visit) return null;
  const options = usableForLine(subscriptions, salonId, visit, uses, lines);
  const selected = uses.find((u) => u.recordServiceId === visit.recordServiceId)?.subscriptionId;
  if (!options.length && !selected) return null;
  const chosen = subscriptions.find((s) => s.id === selected);

  return (
    <Space size={8} wrap>
      <Select<string>
        size="small"
        allowClear
        placeholder="Оплатити абонементом"
        aria-label="Оплатити абонементом"
        style={{ minWidth: 260 }}
        value={selected}
        onChange={(value?: string) => {
          onChange(value);
        }}
        options={[
          ...options.map(({ subscription: s, left }) => ({
            value: s.id,
            label: `${s.name} · залишок ${formatUnits(left, s.unitKind)} · діє до ${validUntilLabel(s)}`,
          })),
          // Выбранный, но уже не подходящий (данные обновились) — оставляем, сервер ответит 422
          ...(chosen && !options.some((o) => o.subscription.id === chosen.id)
            ? [{ value: chosen.id, label: chosen.name }]
            : []),
        ]}
      />
      {chosen && line.subscriptionId && line.subscriptionUnits != null && (
        <Typography.Text type="secondary">
          −{formatUnits(line.subscriptionUnits, chosen.unitKind)}
        </Typography.Text>
      )}
    </Space>
  );
}
