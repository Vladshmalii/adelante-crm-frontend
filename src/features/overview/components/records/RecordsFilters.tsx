import { Dropdown } from '@/shared/components/ui/Dropdown';
import { RangeDatePicker } from '@/shared/components/ui/RangeDatePicker';
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

    const handleCreatedRangeChange = (range: { from: string; to: string }) => {
        onFiltersChange({
            ...filters,
            createdFrom: range.from,
            createdTo: range.to,
        });
    };

    const handleVisitRangeChange = (range: { from: string; to: string }) => {
        onFiltersChange({
            ...filters,
            visitFrom: range.from,
            visitTo: range.to,
        });
    };

    return (
        <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <RangeDatePicker
                    label="Дата створення"
                    value={{ from: filters.createdFrom || '', to: filters.createdTo || '' }}
                    onChange={handleCreatedRangeChange}
                    placeholder="Оберіть період"
                />
                <RangeDatePicker
                    label="Дата візиту"
                    value={{ from: filters.visitFrom || '', to: filters.visitTo || '' }}
                    onChange={handleVisitRangeChange}
                    placeholder="Оберіть період"
                />
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Dropdown
                    label="Статус візиту"
                    value={filters.visitStatus || ''}
                    options={[
                        { value: '', label: 'Всі' },
                        ...RECORD_STATUSES.map(s => ({ value: s.value, label: s.label })),
                    ]}
                    onChange={(value) => updateFilter('visitStatus', value)}
                />
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
            </div>

            <div className="flex justify-end">
                <button className="px-6 py-2 text-sm font-medium text-accent-foreground bg-accent hover:bg-accent/90 rounded-lg transition-colors">
                    Показати
                </button>
            </div>
        </div>
    );
}