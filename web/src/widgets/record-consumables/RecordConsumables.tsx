import { PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, App, Button, Empty, InputNumber, Select, Space, Table, Typography } from 'antd';
import { useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { formatDateTime, formatQuantity, productUnitLabels, useDebouncedValue } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import { consumablesQueryOptions, productPickerQueryOptions, useWriteOffConsumables } from './api';

type Product = Schema<'ProductOut'>;
type Consumable = Schema<'ConsumableOut'>;

interface RecordConsumablesProps {
  recordId: string;
  /** По отменённой записи бекенд списывать не даёт (409) — форму не показываем. */
  canWriteOff: boolean;
}

/**
 * «Списання витрат» по записи: что уже списано и форма списания со склада. Используется
 * в карточке записи (Огляд, позже Розклад).
 */
export function RecordConsumables({ recordId, canWriteOff }: RecordConsumablesProps) {
  const { data, error, isPending, refetch } = useQuery(consumablesQueryOptions(recordId));

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      {canWriteOff && <WriteOffForm recordId={recordId} />}
      <Table<Consumable>
        size="small"
        rowKey="movementId"
        loading={isPending}
        pagination={false}
        dataSource={data}
        locale={{ emptyText: <Empty description="Нічого не списано" /> }}
        columns={[
          { title: 'Товар', dataIndex: 'productName' },
          {
            title: 'Кількість',
            key: 'quantity',
            align: 'right',
            render: (_, c) => formatQuantity(c.quantity, c.unit),
          },
          { title: 'Хто списав', key: 'author', render: (_, c) => c.author.name ?? '—' },
          { title: 'Коли', key: 'date', render: (_, c) => formatDateTime(c.createdAt) },
        ]}
      />
    </Space>
  );
}

function WriteOffForm({ recordId }: { recordId: string }) {
  const { message } = App.useApp();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const { data: products = [], isFetching } = useQuery(productPickerQueryOptions(debounced));
  const writeOff = useWriteOffConsumables(recordId);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number | null>(null);

  const available = product ? Number(product.quantity) : 0;
  const tooMuch = quantity !== null && quantity > available;

  const submit = () => {
    if (!product || !quantity) return;
    writeOff.mutate([{ productId: product.id, quantity }], {
      onSuccess: () => {
        void message.success('Списано');
        setProduct(null);
        setQuantity(null);
      },
      onError: (e) => void message.error(errorMessage(e)),
    });
  };

  return (
    <Space orientation="vertical" style={{ width: '100%' }}>
      <Space.Compact style={{ width: '100%' }}>
        <Select<string>
          style={{ flex: 1, minWidth: 0 }}
          placeholder="Товар: назва або артикул"
          showSearch={{ filterOption: false, onSearch: setQuery }}
          loading={isFetching}
          value={product?.id}
          notFoundContent={isFetching ? 'Шукаємо…' : 'Товарів не знайдено'}
          options={products.map((p) => ({
            value: p.id,
            label: `${p.name} · ${formatQuantity(p.quantity, p.unit)}`,
            disabled: p.stockStatus === 'out',
          }))}
          onChange={(id) => {
            setProduct(products.find((p) => p.id === id) ?? null);
            setQuantity(null);
          }}
        />
        <InputNumber<number>
          style={{ width: 150 }}
          placeholder="Кількість"
          min={0.001}
          value={quantity}
          disabled={!product}
          status={tooMuch ? 'error' : undefined}
          suffix={product ? productUnitLabels[product.unit] : undefined}
          onChange={setQuantity}
          onPressEnter={submit}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          loading={writeOff.isPending}
          disabled={!product || !quantity || tooMuch}
          onClick={submit}
        >
          Списати
        </Button>
      </Space.Compact>
      {tooMuch && product && (
        <Alert
          type="error"
          showIcon
          title={`На складі лише ${formatQuantity(product.quantity, product.unit)}`}
        />
      )}
      <Typography.Text type="secondary">
        Списання не скасовується — помилку виправляйте коригуванням залишку на складі.
      </Typography.Text>
    </Space>
  );
}
