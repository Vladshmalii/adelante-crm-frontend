import { Alert, Checkbox, Descriptions, Space, Table, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';

import type { Schema } from '@/shared/api';
import { formatMoney, formatUnitPrice } from '@/shared/lib';

import { discountSourceLabels, formatCardNumber, type PaymentCheck } from './model';

type Checkout = Schema<'CheckoutOut'>;
type Line = Schema<'CheckoutLineOut'>;

/**
 * Предпросмотр оплаты (раздел 6, шаг 1): карта и уровень, строки с бонусными услугами и товарами,
 * «Продано», скидка с источником, итог. Итог считает сервер — его же шлём как expectedTotal.
 */
export function CheckoutSummary({
  checkout,
  bonusIds,
  onBonusChange,
  lineExtra,
}: {
  checkout: Checkout;
  bonusIds?: string[];
  /** Нет — строки без чекбоксов (продажа без записи). */
  onBonusChange?: (ids: string[]) => void;
  /** Под названием строки: выбор «Оплатити абонементом» (subscriptions.md, раздел 6). */
  lineExtra?: (line: Line) => ReactNode;
}) {
  const selected = new Set(bonusIds ?? []);
  const toggle = (line: Line, checked: boolean) => {
    if (!onBonusChange || !line.recordServiceId) return;
    const next = new Set(selected);
    if (checked) next.add(line.recordServiceId);
    else next.delete(line.recordServiceId);
    onBonusChange([...next]);
  };
  const hasBonusColumn =
    !!onBonusChange && checkout.lines.some((l) => l.bonusAvailable || l.isBonus);

  return (
    <Space orientation="vertical" size="small" style={{ display: 'flex', marginBottom: 16 }}>
      {checkout.card && (
        <Typography.Text>
          Картка <Typography.Text strong>{formatCardNumber(checkout.card.number)}</Typography.Text>{' '}
          · {checkout.card.cardTypeName}
          {checkout.card.level?.name && (
            <Tag color="gold" style={{ marginLeft: 8 }}>
              {checkout.card.level.name}
            </Tag>
          )}
        </Typography.Text>
      )}
      {checkout.lines.length > 1 ||
      hasBonusColumn ||
      !!lineExtra ||
      checkout.lines.some((l) => l.kind !== 'service') ? (
        <Table<Line>
          size="small"
          rowKey={(l) => l.recordServiceId ?? `${l.kind}-${checkout.lines.indexOf(l)}`}
          pagination={false}
          dataSource={checkout.lines}
          columns={[
            ...(hasBonusColumn
              ? [
                  {
                    title: 'Бонус',
                    key: 'bonus',
                    width: 64,
                    render: (_: unknown, l: Line) =>
                      (l.bonusAvailable || l.isBonus) && (
                        <Checkbox
                          checked={l.isBonus}
                          aria-label={`Бонусна послуга: ${l.name}`}
                          onChange={(e) => {
                            toggle(l, e.target.checked);
                          }}
                        />
                      ),
                  },
                ]
              : []),
            {
              title: 'Позиція',
              key: 'name',
              render: (_, l) => (
                <Space orientation="vertical" size={4}>
                  <LineName line={l} />
                  {lineExtra?.(l)}
                </Space>
              ),
            },
            {
              title: 'Ціна',
              key: 'price',
              align: 'right',
              render: (_, l) =>
                l.isBonus || l.subscriptionId ? (
                  <Space orientation="vertical" size={0} align="end">
                    <Typography.Text delete type="secondary">
                      {formatMoney(l.price)}
                    </Typography.Text>
                    {l.subscriptionId && formatMoney(0)}
                  </Space>
                ) : (
                  formatMoney(l.price)
                ),
            },
          ]}
        />
      ) : null}
      <Descriptions
        size="small"
        column={1}
        items={[
          { label: 'Продано', children: formatMoney(checkout.sold) },
          ...(Number(checkout.bonusAmount) > 0
            ? [{ label: 'Бонусні послуги', children: `−${formatMoney(checkout.bonusAmount)}` }]
            : []),
          ...(Number(checkout.subscriptionUsedAmount) > 0
            ? [
                {
                  label: 'Оплачено абонементом',
                  children: `−${formatMoney(checkout.subscriptionUsedAmount)}`,
                },
              ]
            : []),
          {
            label: 'Знижка',
            children:
              checkout.discountSource === 'none'
                ? '—'
                : `−${formatMoney(checkout.discountAmount)} · ${discountSourceLabels[checkout.discountSource]}`,
          },
          ...(Number(checkout.certificatesAmount) > 0
            ? [
                {
                  label: 'Сертифікати',
                  children: `${formatMoney(checkout.certificatesAmount)} · без знижки й кешбеку, лише касою`,
                },
              ]
            : []),
          {
            label: 'До сплати',
            children: (
              <Typography.Text strong style={{ fontSize: 16 }}>
                {formatMoney(checkout.total)}
              </Typography.Text>
            ),
          },
        ]}
      />
    </Space>
  );
}

/** Название строки с пометками: бонусная, абонемент, сертификат, товар. */
function LineName({ line: l }: { line: Line }) {
  return l.isBonus ? (
    <Space size={4}>
      {l.name}
      <Tag color="green">безкоштовно</Tag>
    </Space>
  ) : l.subscriptionId ? (
    <Space size={4}>
      {l.name}
      <Tag color="cyan">абонемент</Tag>
    </Space>
  ) : l.kind === 'certificate' ? (
    <Space size={4}>
      {l.name}
      <Tag color="purple">сертифікат</Tag>
    </Space>
  ) : l.kind === 'subscription' ? (
    <Space size={4}>
      {l.name}
      <Tag color="cyan">абонемент</Tag>
    </Space>
  ) : l.productId ? (
    <Space size={4} wrap>
      {l.name}
      {l.mode === 'package' && <Tag color="blue">пляшка</Tag>}
      <Typography.Text type="secondary">
        {Number(l.quantity)} × {formatUnitPrice(l.unitPrice)}
      </Typography.Text>
    </Space>
  ) : (
    l.name
  );
}

/** Предупреждения по частям оплаты: долг (с подтверждением), лимит кешбэка. */
export function PaymentWarnings({
  check,
  debtConfirmed,
  onDebtConfirm,
}: {
  check: PaymentCheck;
  debtConfirmed: boolean;
  onDebtConfirm: (value: boolean) => void;
}) {
  return (
    <Space orientation="vertical" style={{ display: 'flex' }}>
      {check.debt > 0 && (
        <Alert
          type="warning"
          showIcon
          title={`Буде записано в борг: ${formatMoney(check.debt)}`}
          description={
            <Checkbox
              checked={debtConfirmed}
              onChange={(e) => {
                onDebtConfirm(e.target.checked);
              }}
            >
              Підтверджую запис у борг
            </Checkbox>
          }
        />
      )}
      {check.bonusOverLimit && (
        <Alert type="error" showIcon title="Кешбеком не можна оплатити стільки в цьому чеку" />
      )}
      {check.certificatesNotByRegister && (
        <Alert
          type="error"
          showIcon
          title="Сертифікати оплачуються лише касовими способами — не з рахунку чи кешбеком"
        />
      )}
    </Space>
  );
}
