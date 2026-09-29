import { describe, expect, it } from 'vitest';

import type { Schema } from '@/shared/api';

import { reminderStatus } from './reminder';

const record = (patch: Partial<Schema<'RecordOut'>>) =>
  ({
    reminderEnabled: true,
    reminderSentAt: null,
    clientTelegramLinked: true,
    ...patch,
  }) as Schema<'RecordOut'>;

describe('статус напоминания', () => {
  it('выключено важнее всего', () => {
    expect(reminderStatus(record({ reminderEnabled: false })).text).toBe('Вимкнено');
  });
  it('отправлено — с датой и временем по Киеву', () => {
    expect(reminderStatus(record({ reminderSentAt: '2026-09-28T10:30:00Z' })).text).toBe(
      'Надіслано 28.09 о 13:30',
    );
  });
  it('без Telegram не дойдёт', () => {
    expect(reminderStatus(record({ clientTelegramLinked: false })).text).toBe(
      'Клієнт не підключений до Telegram-бота',
    );
  });
  it('иначе — будет отправлено', () => {
    expect(reminderStatus(record({})).text).toBe('Буде надіслано за 30 хв до візиту');
  });
});
