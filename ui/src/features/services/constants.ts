import type { ServiceCategory, ServiceStatus } from './types';

export const SERVICE_CATEGORIES: Array<{ value: ServiceCategory; label: string }> = [
    { value: 'hair', label: 'Волосся' },
    { value: 'nails', label: 'Нігті' },
    { value: 'face', label: 'Обличчя' },
    { value: 'body', label: 'Тіло' },
    { value: 'makeup', label: 'Макіяж' },
    { value: 'other', label: 'Інше' },
];

export const SERVICE_STATUSES: Array<{ value: ServiceStatus; label: string }> = [
    { value: 'active', label: 'Активна' },
    { value: 'inactive', label: 'Неактивна' },
    { value: 'archived', label: 'Архівована' },
];
