import type { Schema } from '@/shared/api';
import { inSalonTz, pluralUk } from '@/shared/lib';

type Status = Schema<'SubscriptionStatus'>;
type UnitKind = Schema<'SubscriptionUnitKind'>;
type Subscription = Schema<'SubscriptionOut'>;
type SubscriptionType = Schema<'SubscriptionTypeOut'>;

/** Статусы абонемента (frontend-subscriptions.md, раздел 4). */
export const subscriptionStatusLabels: Record<Status, { text: string; color: string }> = {
  pending: { text: 'Очікує активації', color: 'default' },
  active: { text: 'Активний', color: 'green' },
  frozen: { text: 'Заморожений', color: 'blue' },
  spent: { text: 'Використаний', color: 'default' },
  expired: { text: 'Термін минув', color: 'orange' },
  cancelled: { text: 'Анульований', color: 'red' },
};

export const unitKindLabels: Record<UnitKind, string> = {
  visits: 'Відвідування',
  minutes: 'Хвилини',
};

export const balanceModeLabels: Record<Schema<'SubscriptionBalanceMode'>, string> = {
  shared: 'Загальний',
  separate: 'Роздільний',
};

export const activationModeLabels: Record<Schema<'SubscriptionActivationMode'>, string> = {
  on_sale: 'При продажу',
  first_visit: 'При першому візиті',
};

/** Операции журнала (subscriptions.md, 3.1). */
export const operationTypeLabels: Record<
  Schema<'SubscriptionOperationType'>,
  { text: string; color: string }
> = {
  issue: { text: 'Продаж', color: 'green' },
  use: { text: 'Списання', color: 'blue' },
  reversal: { text: 'Сторно', color: 'default' },
  expire: { text: 'Згоряння', color: 'orange' },
  cancel: { text: 'Анулювання', color: 'red' },
};

/** «3 відв.», «45 хв». */
export const formatUnits = (n: number, kind: UnitKind) =>
  kind === 'minutes' ? `${String(n)} хв` : `${String(n)} відв.`;

/** Срок типа: «Безстроковий», «30 днів», «1 місяць». */
export function durationLabel(value: number, unit: Schema<'SubscriptionDurationUnit'>): string {
  if (!value) return 'Безстроковий';
  const word =
    unit === 'month'
      ? pluralUk(value, ['місяць', 'місяці', 'місяців'])
      : pluralUk(value, ['день', 'дні', 'днів']);
  return `${String(value)} ${word}`;
}

/** Единицы типа: общий баланс — «10 відв.», раздельный — «12 відв. на 3 послуги». */
export function typeUnitsLabel(
  t: Pick<SubscriptionType, 'unitKind' | 'balanceMode' | 'totalUnits' | 'services'>,
): string {
  if (t.balanceMode === 'shared') return formatUnits(t.totalUnits ?? 0, t.unitKind);
  const total = t.services.reduce((sum, s) => sum + (s.units ?? 0), 0);
  const n = t.services.length;
  return `${formatUnits(total, t.unitKind)} на ${String(n)} ${pluralUk(n, ['послугу', 'послуги', 'послуг'])}`;
}

/** Общий остаток: «8 з 10 відв.». */
export const balanceLabel = (s: Pick<Subscription, 'balance' | 'unitsTotal' | 'unitKind'>) =>
  `${String(s.balance)} з ${formatUnits(s.unitsTotal, s.unitKind)}`;

/** Остатки по услугам при раздельном балансе: «Манікюр (Салон 1): 2 з 5 відв.». */
export function serviceBalances(
  s: Pick<Subscription, 'balanceMode' | 'services' | 'unitKind'>,
): string[] {
  if (s.balanceMode !== 'separate') return [];
  return s.services.map((x) => {
    const name = `${x.serviceName ?? 'Послугу видалено'}${x.salonName ? ` (${x.salonName})` : ''}`;
    return `${name}: ${String(x.balance)} з ${formatUnits(x.units ?? 0, s.unitKind)}`;
  });
}

const day = (iso: string) => inSalonTz(iso).format('DD.MM.YYYY');

/**
 * «Діє до»: дата окончания; у ещё не активированного — когда активируется; бессрочный.
 * Срок отсчитывается от активации, поэтому у `pending` даты окончания ещё нет.
 */
export function validUntilLabel(
  s: Pick<Subscription, 'status' | 'expiresAt' | 'durationValue' | 'autoActivateAt'>,
): string {
  if (s.expiresAt) return day(s.expiresAt);
  if (s.durationValue && s.status === 'pending') {
    return s.autoActivateAt
      ? `з першого візиту, не пізніше ${day(s.autoActivateAt)}`
      : 'з першого візиту';
  }
  return s.durationValue ? '—' : 'Безстроковий';
}

/** «до 20.11.2026» или «до розморозки» (без лимита); null — не заморожен. */
export const frozenUntilLabel = (s: Pick<Subscription, 'status' | 'freezeUntil'>) =>
  s.status !== 'frozen' ? null : s.freezeUntil ? `до ${day(s.freezeUntil)}` : 'до розморозки';

export interface FreezeState {
  action: 'freeze' | 'unfreeze';
  /** Есть — кнопка неактивна с подсказкой. */
  disabledReason?: string;
}

/**
 * Что можно сделать с заморозкой (subscriptions.md, раздел 7 и 14.4): замороженный —
 * разморозить; активный — заморозить, если тип разрешает, заморозки ещё не было, срок не
 * бессрочный и не вышел. null — кнопки нет совсем.
 */
export function freezeState(
  s: Pick<Subscription, 'status' | 'freezeAllowed' | 'freezeUsed' | 'expiresAt'>,
  now: Date = new Date(),
): FreezeState | null {
  if (s.status === 'frozen') return { action: 'unfreeze' };
  if (s.status !== 'active' || !s.freezeAllowed) return null;
  if (s.freezeUsed) return { action: 'freeze', disabledReason: 'Заморозку вже використано' };
  if (!s.expiresAt) {
    return { action: 'freeze', disabledReason: 'Безстроковий абонемент не заморожують' };
  }
  if (new Date(s.expiresAt) <= now) {
    return { action: 'freeze', disabledReason: 'Термін дії минув' };
  }
  return { action: 'freeze' };
}

/** «до 14 днів» / «без обмеження днів». */
export const freezeLimitLabel = (maxDays: number) =>
  maxDays
    ? `до ${String(maxDays)} ${pluralUk(maxDays, ['дня', 'днів', 'днів'])}`
    : 'без обмеження днів';

/** Строка услуги визита: id строки записи, услуга и её длительность (для минут). */
export interface VisitLine {
  recordServiceId: string;
  serviceId: string;
  durationMinutes: number;
}

/** Выбор «Оплатити абонементом» у строки визита. */
export interface SubscriptionUse {
  recordServiceId: string;
  subscriptionId: string;
}

/** Списываемое количество строки: 1 посещение или длительность услуги в минутах. */
export const unitsFor = (kind: UnitKind, line: Pick<VisitLine, 'durationMinutes'>) =>
  kind === 'minutes' ? line.durationMinutes : 1;

type UsableSubscription = Pick<
  Subscription,
  'id' | 'balanceMode' | 'unitKind' | 'services' | 'status'
>;

/** Корзина остатка для услуги салона: общая — одна на абонемент, раздельная — на услугу. */
const basketOf = (s: UsableSubscription, salonId: string, serviceId: string) =>
  s.services.find((x) => x.salonId === salonId && x.serviceId === serviceId);

export interface UsableOption<S> {
  subscription: S;
  /** Сколько спишет эта строка. */
  need: number;
  /** Остаток корзины с учётом других строк этого визита, выбравших тот же абонемент. */
  left: number;
}

/**
 * Абонементы клиента, которыми можно оплатить строку: услуга салона есть в снимке и остатка
 * корзины хватает с учётом уже выбранных в других строках. Частичного списания нет. Сервер
 * проверяет всё ещё раз (статус, срок) — это только подсказка для выбора.
 */
export function usableForLine<S extends UsableSubscription>(
  subscriptions: readonly S[],
  salonId: string,
  line: VisitLine,
  uses: readonly SubscriptionUse[],
  lines: readonly VisitLine[],
): UsableOption<S>[] {
  const result: UsableOption<S>[] = [];
  for (const s of subscriptions) {
    if (s.status !== 'active' && s.status !== 'pending') continue;
    const basket = basketOf(s, salonId, line.serviceId);
    if (!basket) continue;
    let taken = 0;
    for (const use of uses) {
      if (use.subscriptionId !== s.id || use.recordServiceId === line.recordServiceId) continue;
      const other = lines.find((l) => l.recordServiceId === use.recordServiceId);
      if (!other) continue;
      const sameBasket =
        s.balanceMode === 'shared' || basketOf(s, salonId, other.serviceId) === basket;
      if (sameBasket) taken += unitsFor(s.unitKind, other);
    }
    const need = unitsFor(s.unitKind, line);
    const left = basket.balance - taken;
    if (need > 0 && left >= need) result.push({ subscription: s, need, left });
  }
  return result;
}

/** Выбрать или снять абонемент у строки. */
export function setUse(
  uses: readonly SubscriptionUse[],
  recordServiceId: string,
  subscriptionId: string | undefined,
): SubscriptionUse[] {
  const rest = uses.filter((u) => u.recordServiceId !== recordServiceId);
  return subscriptionId ? [...rest, { recordServiceId, subscriptionId }] : rest;
}

/** Параметры предпросмотра: `<recordServiceId>:<subscriptionId>`. */
export const subscriptionUsesParams = (uses: readonly SubscriptionUse[]) =>
  uses.map((u) => `${u.recordServiceId}:${u.subscriptionId}`);

/** Позиция продажи в чеке: одна позиция — один абонемент (до 20 в чеке, как на сервере). */
export interface SubscriptionSaleItem {
  /** Ключ позиции в списке: два одинаковых типа — две позиции. */
  key: string;
  typeId: string;
}

export const MAX_SUBSCRIPTIONS_IN_RECEIPT = 20;

export const subscriptionTypeIdsOf = (items: readonly SubscriptionSaleItem[]) =>
  items.map((item) => item.typeId);

export const subscriptionsBody = (items: readonly SubscriptionSaleItem[]) =>
  items.map((item) => ({ typeId: item.typeId }));
