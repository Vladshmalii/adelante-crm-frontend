import { describe, expect, it } from 'vitest';

import { balanceKind, checkPayments, methodAvailable } from './model';

const types: Record<string, 'cash' | 'account' | 'bonus' | 'certificate'> = {
  cash: 'cash',
  acc: 'account',
  cb: 'bonus',
  cert: 'certificate',
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
      { total: '1000.00', accountBalance: '250.00', cashback: null, certificatesAmount: '0' },
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
      certificatesAmount: '0',
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
        certificatesAmount: '0',
      },
    );
    expect(check.bonusPart).toBe(0.3);
    expect(check.bonusOverLimit).toBe(true);
    expect(check.difference).toBe(-0.7);
  });

  it('сертификаты — только кассой: счёт и кешбэк покрывают лишь остальное', () => {
    const preview = {
      total: '800',
      accountBalance: '1000',
      cashback: null,
      certificatesAmount: '500',
    };
    const ok = checkPayments(
      [
        { paymentMethodId: 'acc', amount: 300 },
        { paymentMethodId: 'cash', amount: 500 },
      ],
      methodType,
      preview,
    );
    expect(ok.certificatesNotByRegister).toBe(false);
    const bad = checkPayments(
      [
        { paymentMethodId: 'acc', amount: 400 },
        { paymentMethodId: 'cash', amount: 400 },
      ],
      methodType,
      preview,
    );
    expect(bad.certificatesNotByRegister).toBe(true);
    // Другим сертификатом проданный сертификат тоже не оплатить
    const byCertificate = checkPayments(
      [
        { paymentMethodId: 'cert', amount: 400, certificateCode: 'ADL-22222-22222' },
        { paymentMethodId: 'cash', amount: 400 },
      ],
      methodType,
      preview,
    );
    expect(byCertificate.certificatesNotByRegister).toBe(true);
  });
});

describe('methodAvailable', () => {
  const method = (type: 'cash' | 'bonus' | 'certificate') => ({ id: type, name: type, type });

  it('«Сертифікат» — только с клиентом, кешбэк — только с картой', () => {
    expect(methodAvailable(method('cash'), undefined)).toBe(true);
    expect(methodAvailable(method('certificate'), undefined)).toBe(false);
    const withClient = { clientId: 'c', cashback: null } as Parameters<typeof methodAvailable>[1];
    expect(methodAvailable(method('certificate'), withClient)).toBe(true);
    expect(methodAvailable(method('bonus'), withClient)).toBe(false);
  });
});

describe('balanceKind', () => {
  it('знак баланса', () => {
    expect(balanceKind('12.50')).toBe('deposit');
    expect(balanceKind('-1')).toBe('debt');
    expect(balanceKind('0.00')).toBe('zero');
  });
});
