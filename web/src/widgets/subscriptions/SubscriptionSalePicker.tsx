import { DeleteOutlined, IdcardOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Select, Space, Tooltip, Typography } from 'antd';

import { formatMoney } from '@/shared/lib';

import { subscriptionTypesQueryOptions } from './api';
import {
  durationLabel,
  MAX_SUBSCRIPTIONS_IN_RECEIPT,
  type SubscriptionSaleItem,
  typeUnitsLabel,
} from './model';

/**
 * «+ Абонемент» в окне оплаты (subscriptions.md, раздел 5): активные типы сети, одна позиция —
 * один абонемент. Абонемент именной — продаётся клиенту чека; без клиента выбор неактивен
 * (`disabledReason`). На строку действуют скидки и кешбэк, считает сервер.
 */
export function SubscriptionSalePicker({
  value,
  onChange,
  disabledReason,
}: {
  value: SubscriptionSaleItem[];
  onChange: (items: SubscriptionSaleItem[]) => void;
  disabledReason?: string;
}) {
  const types = useQuery(subscriptionTypesQueryOptions());
  const active = (types.data ?? [])
    .filter((t) => t.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'uk'));
  const byId = new Map((types.data ?? []).map((t) => [t.id, t]));
  if (!active.length && !value.length) return null;
  const full = value.length >= MAX_SUBSCRIPTIONS_IN_RECEIPT;

  return (
    <Space orientation="vertical" size="small" style={{ display: 'flex', marginBottom: 16 }}>
      {value.map((item) => {
        const type = byId.get(item.typeId);
        return (
          <Space key={item.key} wrap>
            <IdcardOutlined />
            <Typography.Text>{type?.name ?? 'Абонемент'}</Typography.Text>
            <Typography.Text type="secondary">
              {type
                ? `${typeUnitsLabel(type)} · ${durationLabel(type.durationValue, type.durationUnit)} · ${formatMoney(type.price)}`
                : ''}
            </Typography.Text>
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              aria-label="Прибрати абонемент"
              onClick={() => {
                onChange(value.filter((x) => x !== item));
              }}
            />
          </Space>
        );
      })}
      {active.length > 0 && (
        <Tooltip title={disabledReason}>
          <Select<string>
            value={null}
            placeholder="+ Абонемент"
            style={{ width: 320 }}
            disabled={!!disabledReason || full}
            loading={types.isPending}
            showSearch={{ optionFilterProp: 'label' }}
            options={[
              {
                label: 'Абонементи Мережа Adelante',
                options: active.map((t) => ({
                  value: t.id,
                  label: `${t.name} · ${formatMoney(t.price)}`,
                })),
              },
            ]}
            onChange={(typeId) => {
              onChange([...value, { key: crypto.randomUUID(), typeId }]);
            }}
          />
        </Tooltip>
      )}
    </Space>
  );
}
