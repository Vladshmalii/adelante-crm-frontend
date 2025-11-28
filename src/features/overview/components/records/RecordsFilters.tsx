import { Dropdown } from '@/shared/components/ui/Dropdown';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { RECORD_STATUSES, PAYMENT_STATUSES, RECORD_SOURCES } from '../../constants';
import type { RecordsFilters as Filters } from '../../types';

interface RecordsFiltersProps {
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
}

const EMPLOYEES = [
    { value: '', label: 'Всі' },
    { value: 'Олена Коваль', label: 'Олена Коваль' },
    { value: 'Іван Мельник', label: 'Іван Мельник' },
    { value: 'Наталія Ткаченко', label: 'Наталія Ткаченко' },
];

const SERVICE_CATEGORIES = [
    { value: '', label: 'Всі' },
    { value: 'Перукарські', label: 'Перукарські' },
    { value: 'Манікюр/Педикюр', label: 'Манікюр/Педикюр' },
    { value: 'Косметологія', label: 'Косметологія' },
];

export function RecordsFilters({ filters, onFiltersChange }: RecordsFiltersProps) {
    const updateFilter = (key: keyof Filters, value: any) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    return (
        <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DatePicker
                    label="Дата створення (з)"
                    value={filters.createdFrom || ''}
                    onChange={(value) => updateFilter('createdFrom', value)}
                    placeholder="Обрати дату"
                />
                <DatePicker
                    label="Дата створення (до)"
                    value={filters.createdTo || ''}
                    onChange={(value) => updateFilter('createdTo', value)}
                    placeholder="Обрати дату"
                />
                <DatePicker
                    label="Дата візиту (з)"
                    value={filters.visitFrom || ''}
                    onChange={(value) => updateFilter('visitFrom', value)}
                    placeholder="Обрати дату"
                />
                <DatePicker
                    label="Дата візиту (до)"
                    value={filters.visitTo || ''}
                    onChange={(value) => updateFilter('visitTo', value)}
                    placeholder="Обрати дату"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Dropdown
                    label="Співробітник"
                    value={filters.employee || ''}
                    options={EMPLOYEES}
                    onChange={(value) => updateFilter('employee', value)}
                />
                <Dropdown
                    label="Категорія послуг"
                    value={filters.serviceCategory || ''}
                    options={SERVICE_CATEGORIES}
                    onChange={(value) => updateFilter('serviceCategory', value)}
                />
                <Dropdown
                    label="Статус візиту"
                    value={filters.visitStatus || ''}
                    options={[
                        { value: '', label: 'Всі' },
                        ...RECORD_STATUSES.map(s => ({ value: s.value, label: s.label })),
                    ]}
                    onChange={(value) => updateFilter('visitStatus', value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Dropdown
                    label="Статус оплати"
                    value={filters.paymentStatus || ''}
                    options={[
                        { value: '', label: 'Всі' },
                        ...PAYMENT_STATUSES.map(s => ({ value: s.value, label: s.label })),
                    ]}
                    onChange={(value) => updateFilter('paymentStatus', value)}
                />
                <Dropdown
                    label="Джерело запису"
                    value={filters.source || ''}
                    options={[
                        { value: '', label: 'Всі' },
                        ...RECORD_SOURCES.map(s => ({ value: s.value, label: s.label })),
                    ]}
                    onChange={(value) => updateFilter('source', value)}
                />
                <div className="flex items-end">
                    <button className="w-full px-4 py-2 text-sm font-medium text-accent-foreground bg-accent hover:bg-accent/90 rounded-lg transition-colors">
                        Показати
                    </button>
                </div>
            </div>
        </div>
    );
}