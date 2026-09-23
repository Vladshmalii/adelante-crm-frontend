import type { Schema } from '@/shared/api';

interface Label {
  text: string;
  color: string;
}

export const categoryLabels: Record<Schema<'ClientCategory'>, Label> = {
  vip: { text: 'VIP', color: 'gold' },
  regular: { text: 'Постійний', color: 'blue' },
  new: { text: 'Новий', color: 'green' },
  inactive: { text: 'Неактивний', color: 'default' },
};

/** Сегмент считает бекенд по визитам: новый, повторный, потерянный (90 дней без визитов). */
export const segmentLabels: Record<string, Label> = {
  new: { text: 'Новий', color: 'green' },
  repeat: { text: 'Повторний', color: 'blue' },
  lost: { text: 'Втрачений', color: 'red' },
};

export const importanceLabels: Record<Schema<'ClientImportance'>, string> = {
  high: 'Висока',
  medium: 'Середня',
  low: 'Низька',
};

export const visitStatusLabels: Record<Schema<'RecordStatus'>, Label> = {
  scheduled: { text: 'Очікування', color: 'default' },
  confirmed: { text: 'Підтверджено', color: 'blue' },
  arrived: { text: 'Клієнт прийшов', color: 'cyan' },
  completed: { text: 'Завершено', color: 'green' },
  cancelled: { text: 'Скасовано', color: 'red' },
  no_show: { text: 'Не прийшов', color: 'orange' },
};

export const clientFullName = (
  c: Pick<Schema<'ClientOut'>, 'firstName' | 'middleName' | 'lastName'>,
) => [c.lastName, c.firstName, c.middleName].filter(Boolean).join(' ');
