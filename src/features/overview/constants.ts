import type { OverviewTab, RecordStatus, PaymentStatus, RecordSource, ChangeEntity, ChangeAction } from './types';

export const OVERVIEW_TABS: Array<{ id: OverviewTab; label: string }> = [
    { id: 'records', label: 'Записи' },
    { id: 'reviews', label: 'Відгуки' },
    { id: 'changes', label: 'Зміни даних' },
];

export const RECORD_STATUSES: Array<{ value: RecordStatus; label: string }> = [
    { value: 'completed', label: 'Завершено' },
    { value: 'confirmed', label: 'Підтверджено' },
    { value: 'pending', label: 'Очікується' },
    { value: 'cancelled', label: 'Скасовано' },
];

export const PAYMENT_STATUSES: Array<{ value: PaymentStatus; label: string }> = [
    { value: 'paid', label: 'Оплачено' },
    { value: 'unpaid', label: 'Не оплачено' },
    { value: 'partial', label: 'Частково' },
];

export const RECORD_SOURCES: Array<{ value: RecordSource; label: string }> = [
    { value: 'online', label: 'Онлайн' },
    { value: 'phone', label: 'Телефон' },
    { value: 'admin', label: 'Адміністратор' },
    { value: 'walk-in', label: 'Без запису' },
];

export const REVIEW_TYPES = [
    { value: 'all', label: 'Всі' },
    { value: 'positive', label: 'Позитивні' },
    { value: 'neutral', label: 'Нейтральні' },
    { value: 'negative', label: 'Негативні' },
];

export const REVIEW_RATINGS = [
    { value: '', label: 'Всі' },
    { value: 5, label: '5 зірок' },
    { value: 4, label: '4 зірки' },
    { value: 3, label: '3 зірки' },
    { value: 2, label: '2 зірки' },
    { value: 1, label: '1 зірка' },
];

export const CHANGE_ENTITIES: Array<{ value: ChangeEntity; label: string }> = [
    { value: 'client', label: 'Клієнт' },
    { value: 'record', label: 'Запис' },
    { value: 'service', label: 'Послуга' },
    { value: 'employee', label: 'Співробітник' },
    { value: 'product', label: 'Товар' },
];

export const CHANGE_ACTIONS: Array<{ value: ChangeAction; label: string }> = [
    { value: 'created', label: 'Додавання' },
    { value: 'updated', label: 'Зміна' },
    { value: 'deleted', label: 'Видалення' },
];