import { describe, expect, it } from 'vitest';

import { formatUnitPrice } from './money';
import { formatQuantity, packageBreakdown, packagedVolume, toBaseQuantity } from './quantity';

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

describe('ввод упаковками', () => {
  it('фасованный — только не штучный и с объёмом', () => {
    expect(packagedVolume('ml', '1000.000')).toBe(1000);
    expect(packagedVolume('pcs', '10')).toBeNull();
    expect(packagedVolume('ml', null)).toBeNull();
    expect(packagedVolume(undefined, 5)).toBeNull();
  });

  it('упаковки и остаток переводятся в единицу карточки', () => {
    expect(toBaseQuantity(2, 250, 1000)).toBe(2250);
    expect(toBaseQuantity(3, 0, 0.1)).toBe(0.3);
    expect(toBaseQuantity(0, 0.125, 0.5)).toBe(0.125);
  });
});

describe('цена за единицу', () => {
  it('показывает доли копейки', () => {
    expect(formatUnitPrice('0.5000')).toBe('0,5 ₴');
    expect(formatUnitPrice('0.0125')).toBe('0,0125 ₴');
    expect(formatUnitPrice(null)).toBe('—');
  });
});
