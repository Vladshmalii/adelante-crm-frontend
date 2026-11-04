import type { Schema } from '@/shared/api';
import { useDebouncedValue } from '@/shared/lib';

export type ProductSaleMode = Schema<'ProductSaleMode'>;
export type SaleProduct = Pick<
  Schema<'ProductOut'>,
  'id' | 'name' | 'unit' | 'quantity' | 'packageVolume' | 'packagePrice' | 'salePrice'
>;

/** Позиция продажи в окне оплаты: один товар в одном режиме. */
export interface ProductSaleItem {
  product: SaleProduct;
  mode: ProductSaleMode;
  quantity: number;
}

/** Не больше строк товаров в чеке — как на сервере. */
export const MAX_PRODUCT_LINES = 50;

export const productModeLabels: Record<ProductSaleMode, string> = {
  package: 'Пляшка',
  volume: 'На розлив',
};

/** Режимы определяются данными карточки: у `pcs` нет упаковки, без цены режима нет. */
export function availableModes(product: SaleProduct): ProductSaleMode[] {
  const modes: ProductSaleMode[] = [];
  if (product.unit !== 'pcs' && product.packageVolume != null && product.packagePrice != null) {
    modes.push('package');
  }
  if (product.salePrice != null) modes.push('volume');
  return modes;
}

/** Бутылки и штуки продаются только целыми. */
export const isWholeQuantity = (product: SaleProduct, mode: ProductSaleMode) =>
  mode === 'package' || product.unit === 'pcs';

/** Добавить товар: сначала свободный режим; все режимы уже выбраны — +1 к первой строке. */
export function addProduct(items: ProductSaleItem[], product: SaleProduct): ProductSaleItem[] {
  const modes = availableModes(product);
  const used = items.filter((item) => item.product.id === product.id);
  const free = modes.find((mode) => !used.some((item) => item.mode === mode));
  if (free) return [...items, { product, mode: free, quantity: 1 }];
  const first = used[0];
  if (!first) return items;
  return items.map((item) => (item === first ? { ...item, quantity: item.quantity + 1 } : item));
}

/** Сменить режим строки; дробное количество при переходе в бутылки становится целым. */
export function changeMode(item: ProductSaleItem, mode: ProductSaleMode): ProductSaleItem {
  const quantity = isWholeQuantity(item.product, mode)
    ? Math.max(1, Math.floor(item.quantity))
    : item.quantity;
  return { ...item, mode, quantity };
}

const unitPrice = ({ product, mode }: ProductSaleItem) =>
  Number((mode === 'package' ? product.packagePrice : product.salePrice) ?? 0);

/** Количество в единице карточки. */
export const baseQuantity = ({ product, mode, quantity }: ProductSaleItem) =>
  mode === 'package' ? quantity * Number(product.packageVolume ?? 0) : quantity;

/** Сумма строки до скидки — для подсказки; итог считает сервер. */
export const lineAmount = (item: ProductSaleItem) =>
  Math.round(unitPrice(item) * item.quantity * 100 + Number.EPSILON) / 100;

/** Остаток товара после всех строк чека; отрицательный — товара не хватает. */
export const stockLeft = (items: ProductSaleItem[], product: SaleProduct) =>
  Math.round(
    (Number(product.quantity) -
      items
        .filter((item) => item.product.id === product.id)
        .reduce((sum, item) => sum + baseQuantity(item), 0)) *
      1000,
  ) / 1000;

/** Параметры предпросмотра: `<productId>:<mode>:<quantity>`. */
export const productParams = (items: ProductSaleItem[]) =>
  items.map((item) => `${item.product.id}:${item.mode}:${String(item.quantity)}`);

/** Тело оплаты. */
export const productsBody = (items: ProductSaleItem[]): Schema<'ProductSaleIn'>[] =>
  items.map((item) => ({
    productId: item.product.id,
    mode: item.mode,
    quantity: item.quantity,
  }));

/** Параметры предпросмотра с паузой во вводе количества. */
export function useDebouncedProductParams(items: ProductSaleItem[]): string[] {
  // Строка, а не массив: новый массив на каждый рендер запускал бы таймер заново
  const debounced = useDebouncedValue(productParams(items).join(','));
  return debounced ? debounced.split(',') : [];
}
