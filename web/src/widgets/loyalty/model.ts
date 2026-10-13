import type { Schema } from '@/shared/api';
import { formatMoney } from '@/shared/lib';

type TxnType = Schema<'TransactionType'>;
type DiscountSource = Schema<'DiscountSource'>;
type Checkout = Schema<'CheckoutOut'>;
type Method = Pick<Schema<'PaymentMethodRefOut'>, 'id' | 'name' | 'type'>;

export const transactionTypeLabels: Record<TxnType, { text: string; color: string }> = {
  topup: { text: 'Поповнення', color: 'green' },
  refund: { text: 'Повернення коштів', color: 'orange' },
  payment: { text: 'Оплата', color: 'blue' },
  accrual: { text: 'Нарахування', color: 'green' },
  reversal: { text: 'Сторно', color: 'default' },
  adjustment: { text: 'Коригування', color: 'purple' },
  burn: { text: 'Згоряння', color: 'red' },
};

export const discountSourceLabels: Record<DiscountSource, string> = {
  none: 'Без знижки',
  client: 'Особиста знижка клієнта',
  card_percent: '% знижки за карткою',
  card_fixed: 'Фіксована знижка за карткою',
};

export const levelBasisLabels: Record<Schema<'LevelBasis'>, string> = {
  sold_amount: 'За сумою «Продано»',
  visits: 'За кількістю візитів',
};

const num = (value: string | number | null | undefined) => Number(value ?? 0);

/** Особовий рахунок: > 0 — депозит, < 0 — борг. */
export function balanceKind(balance: string | number): 'deposit' | 'debt' | 'zero' {
  const value = num(balance);
  if (value > 0) return 'deposit';
  if (value < 0) return 'debt';
  return 'zero';
}

/** Копейки целым числом — суммы сравниваем без плавающей ошибки. */
export const cents = (value: string | number | null | undefined) => Math.round(num(value) * 100);

export interface PaymentPart {
  paymentMethodId?: string;
  amount?: number;
}

export interface PaymentCheck {
  /** Сумма частей минус итог (0 — сходится). */
  difference: number;
  /** Часть «Особовий рахунок», уходящая в минус: будет записано в долг. */
  debt: number;
  accountPart: number;
  bonusPart: number;
  /** Кешбэком больше, чем можно в этом чеке. */
  bonusOverLimit: boolean;
}

/**
 * Проверка частей оплаты против предпросмотра сервера (раздел 6, шаг 3): сумма = итог,
 * кешбэк ≤ максимума, долг — часть счёта сверх положительного баланса.
 */
export function checkPayments(
  parts: PaymentPart[] | undefined,
  methodType: (id: string | undefined) => Schema<'PaymentMethodType'> | undefined,
  checkout: Pick<Schema<'CheckoutOut'>, 'total' | 'accountBalance' | 'cashback'>,
): PaymentCheck {
  let total = 0;
  let account = 0;
  let bonus = 0;
  for (const part of parts ?? []) {
    const amount = cents(part.amount);
    total += amount;
    const type = methodType(part.paymentMethodId);
    if (type === 'account') account += amount;
    if (type === 'bonus') bonus += amount;
  }
  const available = Math.max(cents(checkout.accountBalance), 0);
  return {
    difference: (total - cents(checkout.total)) / 100,
    debt: Math.max(account - available, 0) / 100,
    accountPart: account / 100,
    bonusPart: bonus / 100,
    bonusOverLimit: bonus > cents(checkout.cashback?.maxPayment),
  };
}

/** Номер карты группами по 4: 1234 5678 9012 3456. */
export const formatCardNumber = (number: string) => number.replace(/(\d{4})(?=\d)/g, '$1 ');

/** Подпись способа оплаты с доступными суммами: «Особовий рахунок — доступно 300 ₴». */
export function methodOptionLabel(method: Method, checkout: Checkout | undefined): string {
  if (!checkout) return method.name;
  if (method.type === 'account') {
    const balance = Number(checkout.accountBalance);
    return balance < 0
      ? `${method.name} — борг ${formatMoney(-balance)}`
      : `${method.name} — доступно ${formatMoney(balance)}`;
  }
  if (method.type === 'bonus') {
    return checkout.cashback
      ? `${method.name} — доступно ${formatMoney(checkout.cashback.balance)}, макс. ${formatMoney(checkout.cashback.maxPayment)}`
      : `${method.name} — немає картки в цьому салоні`;
  }
  return method.name;
}

/** Кешбэком без карты, действующей в салоне, платить нельзя — способ скрываем. */
export const methodAvailable = (method: Method, checkout: Checkout | undefined) =>
  method.type !== 'bonus' || (!!checkout?.cashback && Number(checkout.cashback.maxPayment) > 0);
