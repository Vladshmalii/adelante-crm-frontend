import type { Schema } from '@/shared/api';
interface Labeled {
  text: string;
  color: string;
}

export const stockStatusLabels: Record<Schema<'StockStatus'>, Labeled> = {
  in_stock: { text: 'В наявності', color: 'green' },
  low: { text: 'Закінчується', color: 'orange' },
  out: { text: 'Немає', color: 'red' },
};

export const movementTypeLabels: Record<Schema<'MovementType'>, Labeled> = {
  receipt: { text: 'Надходження', color: 'green' },
  write_off: { text: 'Списання', color: 'red' },
  adjustment: { text: 'Коригування', color: 'blue' },
  sale: { text: 'Продаж', color: 'purple' },
};

export interface Margin {
  /** Продажа − себестоимость, ₴. */
  amount: number;
  /** (Продажа − себестоимость) / продажа, целые проценты. */
  percent: number;
}

/** Маржа товара. `null` — нет одной из цен или цена продажи нулевая. */
export function productMargin(
  costPrice: string | number | null | undefined,
  salePrice: string | number | null | undefined,
): Margin | null {
  if (costPrice == null || costPrice === '' || salePrice == null || salePrice === '') return null;
  const cost = Number(costPrice);
  const sale = Number(salePrice);
  if (!(sale > 0) || Number.isNaN(cost)) return null;
  const amount = Math.round((sale - cost) * 100) / 100;
  return { amount, percent: Math.round((amount / sale) * 100) };
}

/** Маржа упаковки: цена упаковки против себестоимости единицы × объём. */
export function packageMargin(
  costPrice: string | number | null | undefined,
  packagePrice: string | number | null | undefined,
  packageVolume: string | number | null | undefined,
): Margin | null {
  if (costPrice == null || costPrice === '' || packageVolume == null) return null;
  return productMargin(Number(costPrice) * Number(packageVolume), packagePrice);
}
