import { Alert, Checkbox, Descriptions, Space, Table, Tag, Typography } from 'antd';

import type { Schema } from '@/shared/api';
import { formatMoney } from '@/shared/lib';

import { discountSourceLabels, formatCardNumber, type PaymentCheck } from './model';

type Checkout = Schema<'CheckoutOut'>;
type Line = Schema<'CheckoutLineOut'>;

/**
 * Предпросмотр оплаты (раздел 6, шаг 1): карта и уровень, строки с бонусными услугами,
 * «Продано», скидка с источником, итог. Итог считает сервер — его же шлём как expectedTotal.
 */
export function CheckoutSummary({
  checkout,
  bonusIds,
  onBonusChange,
}: {
  checkout: Checkout;
  bonusIds?: string[];
  /** Нет — строки без чекбоксов (продажа без записи). */
  onBonusChange?: (ids: string[]) => void;
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
      {checkout.lines.length > 1 || hasBonusColumn ? (
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
              render: (_, l) =>
                l.isBonus ? (
                  <Space size={4}>
                    {l.name}
                    <Tag color="green">безкоштовно</Tag>
                  </Space>
                ) : l.kind === 'certificate' ? (
                  <Space size={4}>
                    {l.name}
                    <Tag color="purple">сертифікат</Tag>
                  </Space>
                ) : (
                  l.name
                ),
            },
            {
              title: 'Ціна',
              key: 'price',
              align: 'right',
              render: (_, l) =>
                l.isBonus ? (
                  <Typography.Text delete type="secondary">
                    {formatMoney(l.price)}
                  </Typography.Text>
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
