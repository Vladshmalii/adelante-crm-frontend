import { Dropdown } from '@/shared/components/ui/Dropdown';
import { RangeDatePicker } from '@/shared/components/ui/RangeDatePicker';
import { CHANGE_ENTITIES, CHANGE_ACTIONS } from '../../constants';
import type { ChangesFilters as Filters } from '../../types';

interface ChangesFiltersProps {
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
}

const AUTHORS = [
    { value: '', label: 'Всі' },
    { value: 'Адміністратор', label: 'Адміністратор' },
    { value: 'Система', label: 'Система' },
    { value: 'Олена Коваль', label: 'Олена Коваль' },
    { value: 'Іван Мельник', label: 'Іван Мельник' },
    { value: 'Наталія Ткаченко', label: 'Наталія Ткаченко' },
];

export function ChangesFilters({ filters, onFiltersChange }: ChangesFiltersProps) {
    const updateFilter = (key: keyof Filters, value: any) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    const handleDateRangeChange = (range: { from: string; to: string }) => {
        onFiltersChange({
            ...filters,
            dateFrom: range.from,
            dateTo: range.to,
        });
    };

    return (
        <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <RangeDatePicker
                    label="Період"
                    value={{ from: filters.dateFrom || '', to: filters.dateTo || '' }}
                    onChange={handleDateRangeChange}
                    placeholder="Оберіть період"
                />
                <Dropdown
                    label="Сутність"
                    value={filters.entity || ''}
                    options={[
                        { value: '', label: 'Всі' },
                        ...CHANGE_ENTITIES.map(e => ({ value: e.value, label: e.label })),
                    ]}
                    onChange={(value) => updateFilter('entity', value)}
                />
                <Dropdown
                    label="Автор"
                    value={filters.author || ''}
                    options={AUTHORS}
                    onChange={(value) => updateFilter('author', value)}
                />
                <Dropdown
                    label="Дія"
                    value={filters.action || ''}
                    options={[
                        { value: '', label: 'Всі' },
                        ...CHANGE_ACTIONS.map(a => ({ value: a.value, label: a.label })),
                    ]}
                    onChange={(value) => updateFilter('action', value)}
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