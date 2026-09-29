import type { Schema } from '@/shared/api';
import { inSalonTz } from '@/shared/lib';

type RecordItem = Schema<'RecordOut'>;

/** Статус напоминания клиенту — что увидит администратор в карточке записи. */
export function reminderStatus(r: RecordItem): {
  text: string;
  type?: 'secondary' | 'warning' | 'success';
} {
  if (!r.reminderEnabled) return { text: 'Вимкнено', type: 'secondary' };
  if (r.reminderSentAt) {
    const at = inSalonTz(r.reminderSentAt);
    return { text: `Надіслано ${at.format('DD.MM')} о ${at.format('HH:mm')}`, type: 'success' };
  }
  if (!r.clientTelegramLinked)
    return { text: 'Клієнт не підключений до Telegram-бота', type: 'warning' };
  return { text: 'Буде надіслано за 30 хв до візиту' };
}
