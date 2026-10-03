import { describe, expect, it } from 'vitest';

import { formatQuantity } from '@/shared/lib';

import { packageBreakdown, productMargin } from './labels';

describe('остаток товара', () => {
  it('форматирует количество с единицей', () => {
    // uk-UA делит тысячи неразрывным пробелом.
    expect(formatQuantity('1250.000', 'ml')).toMatch(/^1\s250 мл$/);
    expect(formatQuantity('2.500', 'kg')).toBe('2,5 кг');
  });

  it('раскладывает фасованный товар на упаковки и остаток', () => {
    expect(packageBreakdown('1250', 'ml', '500')).toBe('2 шт + 250 мл');
    expect(packageBreakdown('1500', 'ml', '500.000')).toBe('3 шт');
    expect(packageBreakdown('0.3', 'l', '0.1')).toBe('3 шт');
  });

  it('не раскладывает штучный товар, товар без объёма и неполную упаковку', () => {
    expect(packageBreakdown('12', 'pcs', '10')).toBeNull();
    expect(packageBreakdown('250', 'ml', null)).toBeNull();
    expect(packageBreakdown('250', 'ml', '500')).toBeNull();
    expect(packageBreakdown('0', 'ml', '500')).toBeNull();
  });
});

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
