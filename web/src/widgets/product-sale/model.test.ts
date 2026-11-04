import { describe, expect, it } from 'vitest';

import {
  addProduct,
  availableModes,
  baseQuantity,
  changeMode,
  isWholeQuantity,
  lineAmount,
  productParams,
  productsBody,
  type ProductSaleItem,
  type SaleProduct,
  stockLeft,
} from './model';

const shampoo: SaleProduct = {
  id: 'p1',
  name: 'Шампунь',
  unit: 'ml',
  quantity: '2000.000',
  packageVolume: '1000.000',
  packagePrice: '350.00',
  salePrice: '0.5000',
};
const cream: SaleProduct = {
  id: 'p2',
  name: 'Крем',
  unit: 'pcs',
  quantity: '5.000',
  packageVolume: null,
  packagePrice: null,
  salePrice: '80.0000',
};

describe('режимы продажи', () => {
  it('определяются данными карточки', () => {
    expect(availableModes(shampoo)).toEqual(['package', 'volume']);
    expect(availableModes({ ...shampoo, packagePrice: null })).toEqual(['volume']);
    expect(availableModes({ ...shampoo, salePrice: null })).toEqual(['package']);
    expect(availableModes(cream)).toEqual(['volume']);
    expect(availableModes({ ...shampoo, packagePrice: null, salePrice: null })).toEqual([]);
  });

  it('бутылки и штуки — только целые', () => {
    expect(isWholeQuantity(shampoo, 'package')).toBe(true);
    expect(isWholeQuantity(shampoo, 'volume')).toBe(false);
    expect(isWholeQuantity(cream, 'volume')).toBe(true);
  });

  it('при переходе в бутылки количество становится целым', () => {
    const item: ProductSaleItem = { product: shampoo, mode: 'volume', quantity: 0.5 };
    expect(changeMode(item, 'package').quantity).toBe(1);
    expect(changeMode({ ...item, quantity: 2.5 }, 'package').quantity).toBe(2);
    expect(changeMode({ ...item, mode: 'package', quantity: 3 }, 'volume').quantity).toBe(3);
  });
});

describe('добавление товара', () => {
  it('сначала свободный режим, потом +1 к первой строке', () => {
    let items = addProduct([], shampoo);
    expect(items.map((i) => i.mode)).toEqual(['package']);
    items = addProduct(items, shampoo);
    expect(items.map((i) => i.mode)).toEqual(['package', 'volume']);
    items = addProduct(items, shampoo);
    expect(items.map((i) => i.quantity)).toEqual([2, 1]);
  });

  it('товар без цен не добавляется', () => {
    expect(addProduct([], { ...shampoo, packagePrice: null, salePrice: null })).toEqual([]);
  });
});

describe('расчёт строки', () => {
  const pair: ProductSaleItem[] = [
    { product: shampoo, mode: 'package', quantity: 1 },
    { product: shampoo, mode: 'volume', quantity: 250 },
  ];

  it('пример спецификации: 350 + 125, остаток 750 мл', () => {
    expect(pair.map(lineAmount)).toEqual([350, 125]);
    expect(pair.map(baseQuantity)).toEqual([1000, 250]);
    expect(stockLeft(pair, shampoo)).toBe(750);
  });

  it('нехватка суммируется по режимам', () => {
    expect(
      stockLeft(
        [
          { product: shampoo, mode: 'package', quantity: 2 },
          { product: shampoo, mode: 'volume', quantity: 1 },
        ],
        shampoo,
      ),
    ).toBe(-1);
  });

  it('параметры предпросмотра и тело оплаты', () => {
    expect(productParams(pair)).toEqual(['p1:package:1', 'p1:volume:250']);
    expect(productsBody(pair)[1]).toEqual({ productId: 'p1', mode: 'volume', quantity: 250 });
  });
});
