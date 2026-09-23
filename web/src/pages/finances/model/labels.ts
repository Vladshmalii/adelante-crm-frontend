import type { Schema } from '@/shared/api';

interface Label {
  text: string;
  color: string;
}

export const operationTypeLabels: Record<Schema<'OperationType'>, Label> = {
  income: { text: 'Прихід', color: 'green' },
  expense: { text: 'Видаток', color: 'red' },
  transfer: { text: 'Переказ', color: 'blue' },
};

export const operationStatusLabels: Record<Schema<'OperationStatus'>, Label> = {
  completed: { text: 'Проведено', color: 'green' },
  pending: { text: 'В обробці', color: 'orange' },
  cancelled: { text: 'Скасовано', color: 'default' },
};

export const documentTypeLabels: Record<Schema<'DocumentType'>, string> = {
  receipt: 'Чек',
  invoice: 'Рахунок',
  expense: 'Видатковий',
  income: 'Прибутковий',
  act: 'Акт',
};

export const documentStatusLabels: Record<Schema<'DocumentStatus'>, Label> = {
  draft: { text: 'Чернетка', color: 'default' },
  issued: { text: 'Виписано', color: 'blue' },
  paid: { text: 'Оплачено', color: 'green' },
  cancelled: { text: 'Скасовано', color: 'red' },
};

export const contentTypeLabels: Record<Schema<'DocumentContentType'>, string> = {
  services: 'Послуги',
  products: 'Товари',
  mixed: 'Змішаний',
};

export const receiptStatusLabels: Record<Schema<'ReceiptStatus'>, Label> = {
  paid: { text: 'Оплачено', color: 'green' },
  partial: { text: 'Частково', color: 'orange' },
  cancelled: { text: 'Скасовано', color: 'red' },
};

export const receiptSourceLabels: Record<Schema<'ReceiptSource'>, string> = {
  web: 'Адмінка',
  mobile: 'Мобільний',
  pos: 'Термінал',
};

export const methodTypeLabels: Record<Schema<'PaymentMethodType'>, string> = {
  cash: 'Готівка',
  card: 'Картка',
  online: 'Онлайн',
  certificate: 'Сертифікат',
  bonus: 'Бонуси',
  tips: 'Чайові',
  other: 'Інше',
};

export const commissionTypeLabels: Record<Schema<'CommissionType'>, string> = {
  none: 'Без комісії',
  percentage: 'Відсоток',
  fixed: 'Фіксована сума',
};

export const commissionPayerLabels: Record<Schema<'CommissionPayer'>, string> = {
  salon: 'Салон',
  client: 'Клієнт',
  split: 'Навпіл',
};

export const tagOptions = (labels: Record<string, Label>) =>
  Object.entries(labels).map(([value, { text }]) => ({ value, label: text }));
