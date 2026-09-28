import type { Schema } from '@/shared/api';

interface Label {
  text: string;
  color: string;
}

export const recordStatusLabels: Record<Schema<'RecordStatus'>, Label> = {
  scheduled: { text: 'Очікування', color: 'default' },
  confirmed: { text: 'Підтверджено', color: 'blue' },
  arrived: { text: 'Клієнт прийшов', color: 'cyan' },
  completed: { text: 'Завершено', color: 'green' },
  cancelled: { text: 'Скасовано', color: 'red' },
  no_show: { text: 'Не прийшов', color: 'orange' },
};

export const paymentStatusLabels: Record<Schema<'PaymentStatus'>, Label> = {
  unpaid: { text: 'Не оплачено', color: 'red' },
  partial: { text: 'Частково', color: 'orange' },
  paid: { text: 'Оплачено', color: 'green' },
};

export const sourceLabels: Record<Schema<'RecordSource'>, string> = {
  admin: 'Адміністратор',
  booking: 'Онлайн-запис',
  bot: 'Telegram-бот',
  phone: 'Телефон',
  walk_in: 'Без запису',
};

export const importanceLabels: Record<Schema<'RecordImportance'>, Label> = {
  standard: { text: 'Стандартний', color: 'default' },
  important: { text: 'Важливий', color: 'gold' },
  special: { text: 'Особливий', color: 'magenta' },
};

export const reviewTypeLabels = {
  positive: 'Позитивні (4–5)',
  neutral: 'Нейтральні (3)',
  negative: 'Негативні (1–2)',
} as const;

export const auditActionLabels: Record<Schema<'AuditAction'>, Label> = {
  created: { text: 'Додавання', color: 'green' },
  updated: { text: 'Зміна', color: 'blue' },
  deleted: { text: 'Видалення', color: 'red' },
};

export const auditEntityLabels: Record<string, string> = {
  record: 'Запис',
  client: 'Клієнт',
  staff: 'Співробітник',
  service: 'Послуга',
  finance: 'Фінанси',
};
