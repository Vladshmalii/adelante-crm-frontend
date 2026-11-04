import { describe, expect, it } from 'vitest';

import { movementTypeLabels, packageMargin, productMargin } from './labels';

describe('маржа товара', () => {
  it('считает долю от цены продажи', () => {
    expect(productMargin('100.00', '150.00')).toEqual({ amount: 50, percent: 33 });
    expect(productMargin('0', '200')).toEqual({ amount: 200, percent: 100 });
  });

  it('отрицательная, если продаём дешевле себестоимости', () => {
    expect(productMargin('120', '100')).toEqual({ amount: -20, percent: -20 });
  });

  it('нет маржи без одной из цен или при нулевой цене продажи', () => {
    expect(productMargin(null, '100')).toBeNull();
    expect(productMargin('100', undefined)).toBeNull();
    expect(productMargin('50', '0')).toBeNull();
  });
});

describe('маржа упаковки', () => {
  it('считает себестоимость единицы на объём упаковки', () => {
    expect(packageMargin('0.2', '350', '1000')).toEqual({ amount: 150, percent: 43 });
  });

  it('нет маржи без себестоимости, цены или объёма', () => {
    expect(packageMargin(null, '350', '1000')).toBeNull();
    expect(packageMargin('0.2', null, '1000')).toBeNull();
    expect(packageMargin('0.2', '350', null)).toBeNull();
  });
});

describe('типы движений', () => {
  it('продажа подписана', () => {
    expect(movementTypeLabels.sale.text).toBe('Продаж');
  });
});
