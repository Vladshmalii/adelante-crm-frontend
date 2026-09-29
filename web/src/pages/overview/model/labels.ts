import type { Schema } from '@/shared/api';

interface Label {
  text: string;
  color: string;
}

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
