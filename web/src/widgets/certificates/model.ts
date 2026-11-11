import type { Schema } from '@/shared/api';
import { formatDate, formatMoney, inSalonTz, pluralUk } from '@/shared/lib';

type Certificate = Pick<Schema<'CertificateOut'>, 'code' | 'name' | 'amount' | 'expiresAt'>;

export const certificateStatusLabels: Record<
  Schema<'CertificateStatus'>,
  { text: string; color: string }
> = {
  issued: { text: 'Не активований', color: 'blue' },
  active: { text: 'Активний', color: 'green' },
  spent: { text: 'Використано', color: 'default' },
  expired: { text: 'Термін минув', color: 'orange' },
  cancelled: { text: 'Анульовано', color: 'red' },
};

type Scope = Schema<'CertificateScope'>;
type Template = Pick<
  Schema<'CertificateTemplateOut'>,
  'isActive' | 'validDays' | 'validUntil' | 'categoryId' | 'sortOrder' | 'name'
>;
type Category = Pick<Schema<'CertificateCategoryOut'>, 'id' | 'name' | 'sortOrder'>;

/** Область сертификата (certificates.md, 11.1, решение 14). */
export const certificateScopeLabels: Record<Scope, string> = {
  any: 'На все',
  services: 'На вибрані послуги',
  products: 'На вибрані товари',
  services_products: 'На вибрані послуги та товари',
};

export const scopeHasServices = (scope: Scope) =>
  scope === 'services' || scope === 'services_products';
export const scopeHasProducts = (scope: Scope) =>
  scope === 'products' || scope === 'services_products';

/** Срок шаблона в списке: «Безстроковий», «30 днів», «до 31.03.2024». */
export function templateValidity(t: Pick<Template, 'validDays' | 'validUntil'>): string {
  if (t.validUntil) return `до ${formatDate(t.validUntil)}`;
  if (t.validDays) return `${t.validDays} ${pluralUk(t.validDays, ['день', 'дні', 'днів'])}`;
  return 'Безстроковий';
}

/** Сегодня по Киеву, `YYYY-MM-DD`. */
export const salonToday = (now: Date = new Date()) => inSalonTz(now).format('YYYY-MM-DD');

/**
 * Шаблон можно продать: активен и дата «до» не прошла (в сам день `validUntil` ещё продаётся,
 * certificates.md, 13.4, С2). Иначе сервер всё равно ответит 422.
 */
export const isTemplateSellable = (t: Template, today: string = salonToday()) =>
  t.isActive && (!t.validUntil || t.validUntil >= today);

export interface TemplateGroup<T> {
  /** null — «Без категорії». */
  id: string | null;
  name: string;
  items: T[];
}

export const NO_CATEGORY = 'Без категорії';

/**
 * Шаблоны по категориям в порядке `sortOrder` категории (затем названия); «Без категорії» —
 * последней. Шаблоны в группе — по `sortOrder`, затем названию. Пустые группы не показываем;
 * шаблон с неизвестной категорией (список категорий ещё грузится) — в «Без категорії».
 */
export function groupTemplatesByCategory<T extends Template>(
  templates: readonly T[],
  categories: readonly Category[],
): TemplateGroup<T>[] {
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'uk');
  const known = new Map(categories.map((c) => [c.id, c]));
  const groups = [...categories]
    .sort((a, b) => a.sortOrder - b.sortOrder || byName(a, b))
    .map<TemplateGroup<T>>((c) => ({ id: c.id, name: c.name, items: [] }));
  const none: TemplateGroup<T> = { id: null, name: NO_CATEGORY, items: [] };
  for (const t of templates) {
    const group =
      t.categoryId && known.has(t.categoryId) ? groups.find((g) => g.id === t.categoryId) : none;
    (group ?? none).items.push(t);
  }
  return [...groups, none]
    .filter((g) => g.items.length > 0)
    .map((g) => ({
      ...g,
      items: [...g.items].sort((a, b) => a.sortOrder - b.sortOrder || byName(a, b)),
    }));
}

/** Позиция продажи в чеке: шаблон и количество (2 шт. — два сертификата, два кода). */
export interface CertificateSaleItem {
  templateId: string;
  quantity: number;
}

/** Не больше штук одной позиции — как на сервере. */
export const MAX_CERTIFICATE_QUANTITY = 20;

/** Для предпросмотра: id шаблона по одному на штуку. */
export const templateIdsOf = (items: CertificateSaleItem[]) =>
  items.flatMap((item) => Array<string>(item.quantity).fill(item.templateId));

/** Добавить шаблон: такой уже выбран — +1 шт. */
export function addCertificate(items: CertificateSaleItem[], templateId: string) {
  const existing = items.find((item) => item.templateId === templateId);
  if (!existing) return [...items, { templateId, quantity: 1 }];
  return items.map((item) =>
    item === existing
      ? { ...item, quantity: Math.min(item.quantity + 1, MAX_CERTIFICATE_QUANTITY) }
      : item,
  );
}

/** Код введён полностью: ADL + 10 символов (регистр, пробелы и дефисы не важны). */
export const isCompleteCode = (code: string | undefined) =>
  (code ?? '')
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(/^ADL/, '').length === 10;

export const certificateValidity = (expiresAt: string | null) =>
  expiresAt ? `Діє до ${inSalonTz(expiresAt).format('DD.MM.YYYY')}` : 'Безстроковий';

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] ?? ch,
  );

/** Бланки для печати: название, номинал, срок, код — по бланку на сертификат. */
export function certificatesPrintHtml(certificates: Certificate[]): string {
  const blanks = certificates
    .map(
      (c) => `<section class="blank">
  <p class="title">Подарунковий сертифікат</p>
  <p class="name">${escapeHtml(c.name)}</p>
  <p class="amount">${escapeHtml(formatMoney(c.amount))}</p>
  <p class="code">${escapeHtml(c.code)}</p>
  <p class="valid">${escapeHtml(certificateValidity(c.expiresAt))} · Діє в усіх салонах мережі Adelante</p>
</section>`,
    )
    .join('\n');
  return `<!doctype html>
<html lang="uk"><head><meta charset="utf-8"><title>Сертифікати</title>
<style>
  body { font-family: sans-serif; margin: 0; }
  .blank { border: 2px solid #222; border-radius: 12px; margin: 16px; padding: 24px;
    text-align: center; page-break-inside: avoid; }
  .title { font-size: 14px; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
  .name { font-size: 20px; margin: 12px 0 4px; }
  .amount { font-size: 36px; font-weight: bold; margin: 4px 0 16px; }
  .code { font-family: monospace; font-size: 28px; letter-spacing: 3px; margin: 0 0 12px; }
  .valid { font-size: 12px; color: #555; margin: 0; }
</style></head>
<body>
${blanks}
</body></html>`;
}

/** Печать бланков в отдельном окне. false — браузер заблокировал окно. */
export function printCertificates(certificates: Certificate[]): boolean {
  const url = URL.createObjectURL(
    new Blob([certificatesPrintHtml(certificates)], { type: 'text/html' }),
  );
  const win = window.open(url, '_blank', 'width=600,height=800');
  if (!win) {
    URL.revokeObjectURL(url);
    return false;
  }
  win.addEventListener('load', () => {
    win.print();
    URL.revokeObjectURL(url);
  });
  return true;
}
