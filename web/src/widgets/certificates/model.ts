import type { Schema } from '@/shared/api';
import { formatMoney, inSalonTz } from '@/shared/lib';

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
