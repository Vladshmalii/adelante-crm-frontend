/**
 * Телефоны храним как `+380XXXXXXXXX`, показываем как `+380 (XX) XXX-XX-XX`.
 * Номера в другом формате (старые данные, иностранные) не трогаем.
 */
const UA = /^\+?380(\d{9})$/;

export function formatPhone(value: string | null | undefined): string {
  if (!value) return '';
  const match = UA.exec(value.replace(/[^\d+]/g, ''));
  if (!match?.[1]) return value;
  const d = match[1];
  return `+380 (${d.slice(0, 2)}) ${d.slice(2, 5)}-${d.slice(5, 7)}-${d.slice(7)}`;
}

/** Ввод пользователя → значение для API. Без кода страны дописывает +380. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('380')) return `+${digits.slice(0, 12)}`;
  if (digits.startsWith('0')) return `+38${digits.slice(0, 10)}`;
  return input.trim().startsWith('+') ? `+${digits}` : `+380${digits.slice(0, 9)}`;
}

export const isValidPhone = (value: string) => /^\+\d{10,15}$/.test(value);
