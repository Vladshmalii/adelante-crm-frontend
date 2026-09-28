import { describe, expect, it } from 'vitest';

import { formatDate, formatDateTime } from './date';
import { formatMoney } from './money';
import { formatPhone, isValidPhone, normalizePhone } from './phone';

describe('телефон', () => {
  it.each([
    ['0671234567', '+380671234567'],
    ['+380 (67) 123-45-67', '+380671234567'],
    ['380671234567', '+380671234567'],
    ['671234567', '+380671234567'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it('форматирует украинский номер и не трогает другие', () => {
    expect(formatPhone('+380671234567')).toBe('+380 (67) 123-45-67');
    expect(formatPhone('+48123456789')).toBe('+48123456789');
    expect(formatPhone(null)).toBe('');
  });

  it('проверяет формат', () => {
    expect(isValidPhone('+380671234567')).toBe(true);
    expect(isValidPhone('+38067')).toBe(false);
  });
});

describe('даты в поясе салона (Europe/Kyiv)', () => {
  it('переводит момент времени из UTC в Киев', () => {
    // 21:30 UTC летом = 00:30 следующего дня в Киеве (UTC+3)
    expect(formatDateTime('2026-07-01T21:30:00Z')).toBe('02.07.2026 00:30');
  });

  it('календарную дату показывает без сдвига', () => {
    expect(formatDate('2026-07-01')).toBe('01.07.2026');
    expect(formatDate(null)).toBe('—');
  });
});

describe('деньги', () => {
  it('форматирует decimal-строку из API', () => {
    expect(formatMoney('1250.50').replace(/\s/g, ' ')).toBe('1 250,5 ₴');
    expect(formatMoney(null)).toBe('—');
  });
});
