import type { Schema } from '@/shared/api';
import { formatQuantity } from '@/shared/lib';

type Unit = Schema<'ProductUnit'>;
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
};

/**
 * Остаток фасованного товара упаковками: «2 шт + 250 мл». `null` — для штучных товаров,
 * без объёма упаковки или если нет ни одной целой упаковки (тогда хватает общего остатка).
 */
export function packageBreakdown(
  quantity: string | number,
  unit: Unit,
  packageVolume: string | number | null | undefined,
): string | null {
  const total = Number(quantity);
  const volume = Number(packageVolume);
  if (unit === 'pcs' || !(volume > 0) || !(total > 0)) return null;
  // Погрешность float: 1500 / 500 должно дать ровно 3 упаковки.
  const packs = Math.floor(total / volume + 1e-9);
  if (packs === 0) return null;
  const rest = Math.round((total - packs * volume) * 1000) / 1000;
  return rest > 0 ? `${packs} шт + ${formatQuantity(rest, unit)}` : `${packs} шт`;
}

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
