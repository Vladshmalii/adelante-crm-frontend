import { DeleteOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, InputNumber, Segmented, Select, Space, Typography } from 'antd';
import { useState } from 'react';

import {
  formatMoney,
  formatQuantity,
  packageBreakdown,
  productUnitLabels,
  useDebouncedValue,
} from '@/shared/lib';

import { saleProductsQueryOptions } from './api';
import {
  addProduct,
  availableModes,
  changeMode,
  isWholeQuantity,
  lineAmount,
  MAX_PRODUCT_LINES,
  type ProductSaleItem,
  type ProductSaleMode,
  productModeLabels,
  type SaleProduct,
  stockLeft,
} from './model';

const stockText = (product: SaleProduct) =>
  packageBreakdown(product.quantity, product.unit, product.packageVolume) ??
  formatQuantity(product.quantity, product.unit);

/**
 * «+ Товар» в окне оплаты (product-sales.md, раздел 6): поиск по складу, режим «Пляшка / На
 * розлив» (только доступные), количество, остаток и сумма строки. Цена только из карточки, итог
 * со скидкой считает сервер. Товар без цен и без остатка выбрать нельзя.
 */
export function ProductSalePicker({
  value,
  onChange,
}: {
  value: ProductSaleItem[];
  onChange: (items: ProductSaleItem[]) => void;
}) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const products = useQuery(saleProductsQueryOptions(debouncedQuery));

  return (
    <Space orientation="vertical" size="small" style={{ display: 'flex', marginBottom: 16 }}>
      {value.map((item, index) => {
        const { product, mode } = item;
        const modes = availableModes(product);
        const whole = isWholeQuantity(product, mode);
        const left = stockLeft(value, product);
        const replace = (next: ProductSaleItem) => {
          onChange(value.map((x) => (x === item ? next : x)));
        };
        return (
          <Space key={`${product.id}-${String(index)}`} wrap>
            <ShoppingOutlined />
            <Typography.Text>{product.name}</Typography.Text>
            {modes.length > 1 && (
              <Segmented<ProductSaleMode>
                size="small"
                value={mode}
                options={modes.map((m) => ({ value: m, label: productModeLabels[m] }))}
                onChange={(next) => {
                  replace(changeMode(item, next));
                }}
              />
            )}
            <InputNumber
              size="small"
              min={whole ? 1 : 0.001}
              precision={whole ? 0 : 3}
              value={item.quantity}
              suffix={mode === 'package' ? 'шт' : productUnitLabels[product.unit]}
              aria-label={`Кількість: ${product.name}`}
              onChange={(quantity) => {
                if (quantity !== null) replace({ ...item, quantity });
              }}
            />
            <Typography.Text strong>{formatMoney(lineAmount(item))}</Typography.Text>
            <Typography.Text type={left < 0 ? 'danger' : 'secondary'}>
              {left < 0
                ? `Не вистачає: в наявності ${formatQuantity(product.quantity, product.unit)}`
                : `Залишиться ${formatQuantity(left, product.unit)}`}
            </Typography.Text>
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              aria-label={`Прибрати товар: ${product.name}`}
              onClick={() => {
                onChange(value.filter((x) => x !== item));
              }}
            />
          </Space>
        );
      })}
      {value.length < MAX_PRODUCT_LINES && (
        <Select<string>
          value={null}
          placeholder="+ Товар"
          style={{ width: 320 }}
          loading={products.isFetching}
          showSearch={{
            filterOption: false,
            onSearch: setQuery,
          }}
          notFoundContent={products.isFetching ? 'Шукаємо…' : 'Товарів не знайдено'}
          options={(products.data ?? []).map((p) => ({
            value: p.id,
            label: `${p.name} · ${stockText(p)}`,
            // Товар без цен и без остатка не продаётся
            disabled: availableModes(p).length === 0 || Number(p.quantity) <= 0,
          }))}
          onChange={(id) => {
            const product = (products.data ?? []).find((p) => p.id === id);
            if (product) onChange(addProduct(value, product));
            setQuery('');
          }}
        />
      )}
    </Space>
  );
}
