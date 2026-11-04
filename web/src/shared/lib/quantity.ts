import type { Schema } from '@/shared/api';

type Unit = Schema<'ProductUnit'>;

export const productUnitLabels: Record<Unit, string> = {
  pcs: 'шт',
  ml: 'мл',
  l: 'л',
  g: 'г',
  kg: 'кг',
};

const quantityFormat = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 3 });

/** Количество товара приходит из API строкой-decimal (`"1250.000"`). */
export const formatQuantity = (value: string | number, unit: Unit) =>
  `${quantityFormat.format(Number(value))} ${productUnitLabels[unit]}`;

/**
 * Остаток фасованного товара упаковками: «2 шт + 250 мл». `null` — для штучных товаров,
 * без объёма упаковки или если нет ни одной целой упаковки (тогда хватает общего остатка).
 * Одновременно открыта одна упаковка, поэтому целая часть — закрытые (product-sales.md, решение 2).
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

/** Объём упаковки, если товар фасованный (не штучный и объём задан), иначе `null`. */
export function packagedVolume(
  unit: Unit | undefined,
  packageVolume: string | number | null | undefined,
): number | null {
  const volume = Number(packageVolume);
  return unit && unit !== 'pcs' && volume > 0 ? volume : null;
}

/** «Упаковки + остаток в единице» → количество в единице карточки, до 3 знаков. */
export const toBaseQuantity = (packages: number, rest: number, volume: number) =>
  Math.round((packages * volume + rest) * 1000) / 1000;
