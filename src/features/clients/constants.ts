import type { ClientSegment } from './types';

export const SEGMENTS: Array<{ id: ClientSegment; label: string }> = [
    { id: 'new', label: 'Нові' },
    { id: 'repeat', label: 'Повторні' },
    { id: 'lost', label: 'Втрачені' },
    { id: 'subscription-ending', label: 'Закінчується абонемент' },
];

export const ITEMS_PER_PAGE_OPTIONS = [25, 50, 100];

export const DEFAULT_ITEMS_PER_PAGE = 25;