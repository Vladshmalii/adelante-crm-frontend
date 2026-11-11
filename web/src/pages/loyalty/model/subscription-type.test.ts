import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api';

import { NEW_TYPE_VALUES, typeFieldErrors, typeToValues, valuesToBody } from './subscription-type';

const type = {
  id: 't1',
  name: 'Манікюр 5',
  price: '2500.00',
  unitKind: 'visits' as const,
  balanceMode: 'shared' as const,
  totalUnits: 5,
  durationValue: 2,
  durationUnit: 'month' as const,
  activationMode: 'first_visit' as const,
  autoActivateDays: 14,
  freezeAllowed: true,
  freezeMaxDays: 10,
  isActive: true,
  sortOrder: 3,
  services: [{ salonId: 's1', serviceId: 'svc1', units: null }],
  issuedCount: 7,
  createdAt: '2026-11-01T10:00:00Z',
  updatedAt: '2026-11-01T10:00:00Z',
};

describe('typeToValues', () => {
  it('копия — «(копія)» в названии, остальные поля как у типа', () => {
    const values = typeToValues(type, true);
    expect(values.name).toBe('Манікюр 5 (копія)');
    expect(values.price).toBe(2500);
    expect(values.services).toEqual(type.services);
    expect(values.services[0]).not.toBe(type.services[0]);
    expect(typeToValues(type).name).toBe('Манікюр 5');
  });
});

describe('valuesToBody', () => {
  it('общий баланс: кількість у абонемента, у послуг units пусто', () => {
    const body = valuesToBody({
      ...NEW_TYPE_VALUES,
      name: ' Солярій ',
      price: 300,
      totalUnits: 15,
      unitKind: 'minutes',
      services: [{ salonId: 's1', serviceId: 'a', units: 5 }, { salonId: 's1' }],
    });
    expect(body.name).toBe('Солярій');
    expect(body.totalUnits).toBe(15);
    expect(body.services).toEqual([{ salonId: 's1', serviceId: 'a', units: null }]);
  });

  it('роздільний: totalUnits пусто; автоактивация и лимит — только когда имеют смысл', () => {
    const body = valuesToBody({
      ...NEW_TYPE_VALUES,
      balanceMode: 'separate',
      totalUnits: 10,
      services: [{ salonId: 's1', serviceId: 'a', units: 3 }],
      activationMode: 'on_sale',
      autoActivateDays: 5,
      freezeAllowed: false,
      freezeMaxDays: 30,
    });
    expect(body.totalUnits).toBeNull();
    expect(body.services[0]?.units).toBe(3);
    expect(body.autoActivateDays).toBeNull();
    expect(body.freezeMaxDays).toBe(0);
  });

  it('при первом визите и с заморозкой поля уходят как есть', () => {
    const body = valuesToBody({
      ...typeToValues(type),
    });
    expect(body.autoActivateDays).toBe(14);
    expect(body.freezeMaxDays).toBe(10);
  });
});

describe('typeFieldErrors', () => {
  it('ошибки схемы — по путям полей, индексы списков — числа', () => {
    const error = new ApiError(422, {
      message: 'Помилка валідації',
      details: { totalUnits: ['too big'], 'services.1.units': ['>= 1'] },
    });
    expect(typeFieldErrors(error)).toEqual([
      { name: 'totalUnits', errors: ['too big'] },
      { name: ['services', 1, 'units'], errors: ['>= 1'] },
    ]);
  });

  it('бизнес-ошибка без details — к полю по тексту', () => {
    expect(
      typeFieldErrors(new ApiError(422, { message: 'Вкажіть кількість одиниць абонемента' })),
    ).toEqual([{ name: 'totalUnits', errors: ['Вкажіть кількість одиниць абонемента'] }]);
    expect(
      typeFieldErrors(new ApiError(422, { message: 'Послугу не знайдено в салоні' }))[0]?.name,
    ).toBe('services');
    expect(
      typeFieldErrors(new ApiError(422, { message: 'Занадто довгий термін дії' }))[0]?.name,
    ).toBe('durationValue');
  });

  it('не 422 и неизвестный текст — пусто', () => {
    expect(typeFieldErrors(new ApiError(409, { message: 'Послуга' }))).toEqual([]);
    expect(typeFieldErrors(new ApiError(422, { message: 'Щось інше' }))).toEqual([]);
    expect(typeFieldErrors(new Error('x'))).toEqual([]);
  });
});
