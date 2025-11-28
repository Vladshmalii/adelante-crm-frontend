export const OPERATION_TYPES = [
    { value: 'all', label: 'Усі операції' },
    { value: 'payment', label: 'Платіж' },
    { value: 'refund', label: 'Повернення' },
    { value: 'transfer', label: 'Переказ' },
    { value: 'withdrawal', label: 'Видача' },
    { value: 'deposit', label: 'Внесення' },
];

export const OPERATION_STATUSES = [
    { value: 'all', label: 'Усі статуси' },
    { value: 'completed', label: 'Завершено' },
    { value: 'pending', label: 'В обробці' },
    { value: 'cancelled', label: 'Скасовано' },
];

export const DOCUMENT_TYPES = [
    { value: 'all', label: 'Усі документи' },
    { value: 'receipt', label: 'Чек' },
    { value: 'invoice', label: 'Рахунок' },
    { value: 'expense', label: 'Видаток' },
    { value: 'income', label: 'Прихід' },
    { value: 'act', label: 'Акт' },
];

export const DOCUMENT_CONTENT_TYPES = [
    { value: 'all', label: 'Весь вміст' },
    { value: 'services', label: 'Послуги' },
    { value: 'products', label: 'Товари' },
    { value: 'mixed', label: 'Змішане' },
];

export const RECEIPT_STATUSES = [
    { value: 'all', label: 'Усі статуси' },
    { value: 'paid', label: 'Оплачено' },
    { value: 'cancelled', label: 'Скасовано' },
    { value: 'partial', label: 'Часткова оплата' },
];

export const PAYMENT_METHOD_TYPES = [
    { value: 'cash', label: 'Готівка' },
    { value: 'card', label: 'Картка' },
    { value: 'online', label: 'Онлайн платіж' },
    { value: 'certificate', label: 'Сертифікат' },
    { value: 'bonus', label: 'Бонуси' },
    { value: 'tips', label: 'Чаї' },
    { value: 'other', label: 'Інше' },
];

export const COMMISSION_TYPES = [
    { value: 'none', label: 'Без комісії' },
    { value: 'percentage', label: 'Відсоток' },
    { value: 'fixed', label: 'Фіксована сума' },
];

export const COMMISSION_PAYERS = [
    { value: 'client', label: 'Клієнт' },
    { value: 'salon', label: 'Салон' },
    { value: 'split', label: 'Поровну' },
];