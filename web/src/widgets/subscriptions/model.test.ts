import { describe, expect, it } from 'vitest';

import {
  balanceLabel,
  durationLabel,
  formatUnits,
  freezeLimitLabel,
  freezeState,
  frozenUntilLabel,
  serviceBalances,
  setUse,
  subscriptionStatusLabels,
  subscriptionUsesParams,
  typeUnitsLabel,
  usableForLine,
  validUntilLabel,
} from './model';

describe('подписи', () => {
  it('статусы — как в постановке', () => {
    expect(subscriptionStatusLabels.pending).toEqual({
      text: 'Очікує активації',
      color: 'default',
    });
    expect(subscriptionStatusLabels.frozen).toEqual({ text: 'Заморожений', color: 'blue' });
    expect(subscriptionStatusLabels.expired).toEqual({ text: 'Термін минув', color: 'orange' });
    expect(subscriptionStatusLabels.cancelled).toEqual({ text: 'Анульований', color: 'red' });
  });

  it('единицы и срок', () => {
    expect(formatUnits(3, 'visits')).toBe('3 відв.');
    expect(formatUnits(45, 'minutes')).toBe('45 хв');
    expect(durationLabel(0, 'month')).toBe('Безстроковий');
    expect(durationLabel(1, 'month')).toBe('1 місяць');
    expect(durationLabel(6, 'month')).toBe('6 місяців');
    expect(durationLabel(30, 'day')).toBe('30 днів');
    expect(freezeLimitLabel(0)).toBe('без обмеження днів');
    expect(freezeLimitLabel(14)).toBe('до 14 днів');
    expect(freezeLimitLabel(1)).toBe('до 1 дня');
  });

  it('единицы типа: общий и раздельный баланс', () => {
    expect(
      typeUnitsLabel({ unitKind: 'visits', balanceMode: 'shared', totalUnits: 10, services: [] }),
    ).toBe('10 відв.');
    expect(
      typeUnitsLabel({
        unitKind: 'minutes',
        balanceMode: 'separate',
        totalUnits: null,
        services: [
          { salonId: 's', serviceId: 'a', units: 30 },
          { salonId: 's', serviceId: 'b', units: 15 },
        ],
      }),
    ).toBe('45 хв на 2 послуги');
  });
});

const service = (serviceId: string, balance: number, units: number | null = null) => ({
  salonId: 's1',
  salonName: 'Центр',
  serviceId,
  serviceName: serviceId === 'gone' ? null : `Послуга ${serviceId}`,
  units,
  balance,
});

describe('остаток', () => {
  it('общий — «8 з 10 відв.», по услугам только у раздельного', () => {
    expect(balanceLabel({ balance: 8, unitsTotal: 10, unitKind: 'visits' })).toBe('8 з 10 відв.');
    expect(
      serviceBalances({ balanceMode: 'shared', unitKind: 'visits', services: [service('a', 8)] }),
    ).toEqual([]);
    expect(
      serviceBalances({
        balanceMode: 'separate',
        unitKind: 'minutes',
        services: [service('a', 12, 15), service('gone', 0, 5)],
      }),
    ).toEqual(['Послуга a (Центр): 12 з 15 хв', 'Послугу видалено (Центр): 0 з 5 хв']);
  });

  it('діє до: дата по Киеву, ожидание активации, бессрочный', () => {
    expect(
      validUntilLabel({
        status: 'active',
        expiresAt: '2026-12-31T22:00:00Z',
        durationValue: 1,
        autoActivateAt: null,
      }),
    ).toBe('01.01.2027');
    expect(
      validUntilLabel({
        status: 'pending',
        expiresAt: null,
        durationValue: 1,
        autoActivateAt: '2026-11-20T10:00:00Z',
      }),
    ).toBe('з першого візиту, не пізніше 20.11.2026');
    expect(
      validUntilLabel({
        status: 'active',
        expiresAt: null,
        durationValue: 0,
        autoActivateAt: null,
      }),
    ).toBe('Безстроковий');
    expect(frozenUntilLabel({ status: 'frozen', freezeUntil: null })).toBe('до розморозки');
    expect(frozenUntilLabel({ status: 'active', freezeUntil: null })).toBeNull();
  });
});

describe('freezeState', () => {
  const now = new Date('2026-11-11T12:00:00Z');
  const base = {
    status: 'active' as const,
    freezeAllowed: true,
    freezeUsed: false,
    expiresAt: '2026-12-11T12:00:00Z',
  };

  it('активный с разрешённой заморозкой — можно', () => {
    expect(freezeState(base, now)).toEqual({ action: 'freeze' });
  });

  it('замороженный — разморозить', () => {
    expect(freezeState({ ...base, status: 'frozen', freezeUsed: true }, now)).toEqual({
      action: 'unfreeze',
    });
  });

  it('один раз, не бессрочный, не истёкший — иначе кнопка неактивна с причиной', () => {
    expect(freezeState({ ...base, freezeUsed: true }, now)?.disabledReason).toBe(
      'Заморозку вже використано',
    );
    expect(freezeState({ ...base, expiresAt: null }, now)?.disabledReason).toMatch(/Безстроковий/);
    expect(freezeState({ ...base, expiresAt: '2026-11-11T11:00:00Z' }, now)?.disabledReason).toBe(
      'Термін дії минув',
    );
  });

  it('тип не разрешает или статус не активный — кнопки нет', () => {
    expect(freezeState({ ...base, freezeAllowed: false }, now)).toBeNull();
    expect(freezeState({ ...base, status: 'pending' }, now)).toBeNull();
    expect(freezeState({ ...base, status: 'spent' }, now)).toBeNull();
  });
});

describe('usableForLine', () => {
  const shared = {
    id: 'shared',
    status: 'active' as const,
    balanceMode: 'shared' as const,
    unitKind: 'visits' as const,
    services: [service('a', 2), service('b', 2)],
  };
  const minutes = {
    id: 'min',
    status: 'pending' as const,
    balanceMode: 'separate' as const,
    unitKind: 'minutes' as const,
    services: [service('a', 12, 15), service('b', 2, 5)],
  };
  const lines = [
    { recordServiceId: 'r1', serviceId: 'a', durationMinutes: 3 },
    { recordServiceId: 'r2', serviceId: 'b', durationMinutes: 3 },
    { recordServiceId: 'r3', serviceId: 'a', durationMinutes: 10 },
    { recordServiceId: 'r4', serviceId: 'x', durationMinutes: 10 },
  ] as const;
  const ids = (options: { subscription: { id: string } }[]) =>
    options.map((o) => o.subscription.id);

  it('услуга из снимка и хватает остатка; минуты — по длительности', () => {
    const r1 = usableForLine([shared, minutes], 's1', lines[0], [], lines);
    expect(ids(r1)).toEqual(['shared', 'min']);
    expect(r1[1]).toMatchObject({ need: 3, left: 12 });
    // 2 минуты остатка на услугу b, нужно 3 — частичного списания нет
    expect(ids(usableForLine([shared, minutes], 's1', lines[1], [], lines))).toEqual(['shared']);
    expect(usableForLine([shared, minutes], 's1', lines[3], [], lines)).toEqual([]);
    expect(usableForLine([shared], 'other-salon', lines[0], [], lines)).toEqual([]);
  });

  it('другие строки визита уменьшают остаток той же корзины', () => {
    const uses = [
      { recordServiceId: 'r1', subscriptionId: 'shared' },
      { recordServiceId: 'r2', subscriptionId: 'shared' },
    ];
    // Общий баланс 2: обе единицы уже выбраны в r1 и r2
    expect(ids(usableForLine([shared], 's1', lines[2], uses, lines))).toEqual([]);
    // Выбор самой строки остаток не уменьшает
    expect(ids(usableForLine([shared], 's1', lines[0], uses, lines))).toEqual(['shared']);
    // Раздельный: r1 (3 мин на a) не трогает корзину b, но уменьшает a: 12 − 3 = 9 < 10
    const minUses = [{ recordServiceId: 'r1', subscriptionId: 'min' }];
    expect(ids(usableForLine([minutes], 's1', lines[2], minUses, lines))).toEqual([]);
    expect(usableForLine([minutes], 's1', lines[0], minUses, lines)[0]?.left).toBe(12);
  });

  it('замороженный и исчерпанный не предлагаются', () => {
    expect(usableForLine([{ ...shared, status: 'frozen' }], 's1', lines[0], [], lines)).toEqual([]);
  });
});

describe('выбор у строки', () => {
  it('setUse заменяет и снимает; параметры предпросмотра', () => {
    let uses = setUse([], 'r1', 'a');
    uses = setUse(uses, 'r2', 'b');
    uses = setUse(uses, 'r1', 'c');
    expect(subscriptionUsesParams(uses)).toEqual(['r2:b', 'r1:c']);
    expect(setUse(uses, 'r2', undefined)).toEqual([{ recordServiceId: 'r1', subscriptionId: 'c' }]);
  });
});
