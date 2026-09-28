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
