import { ApiError, type Schema } from '@/shared/api';

type SubscriptionType = Schema<'SubscriptionTypeOut'>;

/** Значения формы типа абонемента (frontend-subscriptions.md, 2.2). */
export interface SubscriptionTypeValues {
  name: string;
  price: number;
  unitKind: Schema<'SubscriptionUnitKind'>;
  balanceMode: Schema<'SubscriptionBalanceMode'>;
  /** Только при общем балансе. */
  totalUnits?: number | null;
  services: { salonId?: string; serviceId?: string; units?: number | null }[];
  durationValue: number;
  durationUnit: Schema<'SubscriptionDurationUnit'>;
  activationMode: Schema<'SubscriptionActivationMode'>;
  /** Только при активации «при першому візиті»; пусто — без автоактивации. */
  autoActivateDays?: number | null;
  freezeAllowed: boolean;
  /** 0 — без ограничения. */
  freezeMaxDays?: number | null;
}

export const NEW_TYPE_VALUES: SubscriptionTypeValues = {
  name: '',
  price: 0,
  unitKind: 'visits',
  balanceMode: 'shared',
  totalUnits: null,
  services: [{}],
  durationValue: 1,
  durationUnit: 'month',
  activationMode: 'on_sale',
  autoActivateDays: null,
  freezeAllowed: false,
  freezeMaxDays: 0,
};

/** Тип → форма; `copy` — «Копіювати»: форма создания с полями копии. */
export function typeToValues(t: SubscriptionType, copy = false): SubscriptionTypeValues {
  return {
    name: copy ? `${t.name} (копія)` : t.name,
    price: Number(t.price),
    unitKind: t.unitKind,
    balanceMode: t.balanceMode,
    totalUnits: t.totalUnits,
    services: t.services.map((s) => ({ ...s })),
    durationValue: t.durationValue,
    durationUnit: t.durationUnit,
    activationMode: t.activationMode,
    autoActivateDays: t.autoActivateDays,
    freezeAllowed: t.freezeAllowed,
    freezeMaxDays: t.freezeMaxDays,
  };
}

/**
 * Форма → тело запроса. Поля, потерявшие смысл при выбранных настройках, отправляем пустыми:
 * иначе бекенд ответит 422 на противоречие (subscriptions.md, 13.4, решение 2).
 */
export function valuesToBody(
  v: SubscriptionTypeValues,
): Omit<Schema<'SubscriptionTypeIn'>, 'isActive' | 'sortOrder'> {
  const shared = v.balanceMode === 'shared';
  return {
    name: v.name.trim(),
    price: v.price,
    unitKind: v.unitKind,
    balanceMode: v.balanceMode,
    totalUnits: shared ? (v.totalUnits ?? null) : null,
    services: v.services
      .filter((s): s is { salonId: string; serviceId: string; units?: number | null } =>
        Boolean(s.salonId && s.serviceId),
      )
      .map((s) => ({
        salonId: s.salonId,
        serviceId: s.serviceId,
        units: shared ? null : (s.units ?? null),
      })),
    durationValue: v.durationValue,
    durationUnit: v.durationUnit,
    activationMode: v.activationMode,
    autoActivateDays: v.activationMode === 'first_visit' ? (v.autoActivateDays ?? null) : null,
    freezeAllowed: v.freezeAllowed,
    freezeMaxDays: v.freezeAllowed ? (v.freezeMaxDays ?? 0) : 0,
  };
}

type FieldName = string | (string | number)[];

/** Ошибки бизнес-валидации бекенда приходят текстом без поля — привязываем по смыслу. */
const MESSAGE_FIELDS: [RegExp, FieldName][] = [
  [/кількість одиниць абонемента/i, 'totalUnits'],
  [/послуг/i, 'services'],
  [/термін дії/i, 'durationValue'],
  [/автоактивац/i, 'autoActivateDays'],
  [/заморозк/i, 'freezeMaxDays'],
];

/**
 * Ошибка 422 → ошибки у полей формы типа. Валидация схемы даёт `details` с путями полей
 * (`totalUnits`, `services.0.units`), бизнес-проверки — только текст. Пусто — показать
 * общим сообщением.
 */
export function typeFieldErrors(error: unknown): { name: FieldName; errors: string[] }[] {
  if (!(error instanceof ApiError) || error.status !== 422) return [];
  const result: { name: FieldName; errors: string[] }[] = [];
  for (const [key, value] of Object.entries(error.details ?? {})) {
    if (!Array.isArray(value)) continue;
    const errors = value.filter((v): v is string => typeof v === 'string');
    if (!errors.length) continue;
    const path = key.split('.').map((part) => (/^\d+$/.test(part) ? Number(part) : part));
    result.push({ name: path.length === 1 ? key : path, errors });
  }
  if (result.length) return result;
  const message = error.message;
  const field = MESSAGE_FIELDS.find(([pattern]) => pattern.test(message));
  return field ? [{ name: field[1], errors: [message] }] : [];
}
