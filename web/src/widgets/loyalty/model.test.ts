import { describe, expect, it } from 'vitest';

import { balanceKind, checkPayments } from './model';

const types: Record<string, 'cash' | 'account' | 'bonus'> = {
  cash: 'cash',
  acc: 'account',
  cb: 'bonus',
};
const methodType = (id: string | undefined) => (id ? types[id] : undefined);

describe('checkPayments', () => {
  it('счёт сверх положительного баланса — долг', () => {
    const check = checkPayments(
      [
        { paymentMethodId: 'cash', amount: 400 },
        { paymentMethodId: 'acc', amount: 600 },
      ],
      methodType,
      { total: '1000.00', accountBalance: '250.00', cashback: null },
    );
    expect(check.difference).toBe(0);
    expect(check.accountPart).toBe(600);
    expect(check.debt).toBe(350);
  });

  it('при долге весь счёт уходит в долг', () => {
    const check = checkPayments([{ paymentMethodId: 'acc', amount: 100 }], methodType, {
      total: '100',
      accountBalance: '-50',
      cashback: null,
    });
    expect(check.debt).toBe(100);
  });

  it('кешбэк сверх максимума и расхождение суммы', () => {
    const check = checkPayments(
      [
        { paymentMethodId: 'cb', amount: 0.1 },
        { paymentMethodId: 'cb', amount: 0.2 },
      ],
      methodType,
      {
        total: '1',
        accountBalance: '0',
        cashback: { balance: '1', maxPayment: '0.29', percent: '5' },
      },
    );
    expect(check.bonusPart).toBe(0.3);
    expect(check.bonusOverLimit).toBe(true);
    expect(check.difference).toBe(-0.7);
  });
});

describe('balanceKind', () => {
  it('знак баланса', () => {
    expect(balanceKind('12.50')).toBe('deposit');
    expect(balanceKind('-1')).toBe('debt');
    expect(balanceKind('0.00')).toBe('zero');
  });
});
