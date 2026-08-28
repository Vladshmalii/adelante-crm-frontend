import type { StaffStatus } from './types';

export const STATUSES: Array<{ id: StaffStatus; label: string }> = [
    { id: 'active', label: 'Активні' },
    { id: 'vacation', label: 'У відпустці' },
    { id: 'sick', label: 'На лікарняному' },
    { id: 'fired', label: 'Звільнені' },
];

export const ITEMS_PER_PAGE_OPTIONS = [25, 50, 100];

export const DEFAULT_ITEMS_PER_PAGE = 25;
