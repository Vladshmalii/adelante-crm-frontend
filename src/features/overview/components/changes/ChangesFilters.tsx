import { Dropdown } from '@/shared/components/ui/Dropdown';
import { DatePicker } from '@/shared/components/ui/DatePicker';
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

    return (
        <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DatePicker
                    label="Дата (з)"
                    value={filters.dateFrom || ''}
                    onChange={(value) => updateFilter('dateFrom', value)}
                    placeholder="Обрати дату"
                />
                <DatePicker
                    label="Дата (до)"
                    value={filters.dateTo || ''}
                    onChange={(value) => updateFilter('dateTo', value)}
                    placeholder="Обрати дату"
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Dropdown
                    label="Дія"
                    value={filters.action || ''}
                    options={[
                        { value: '', label: 'Всі' },
                        ...CHANGE_ACTIONS.map(a => ({ value: a.value, label: a.label })),
                    ]}
                    onChange={(value) => updateFilter('action', value)}
                />
                <div className="lg:col-span-2 flex items-end">
                    <button className="w-full px-6 py-2 text-sm font-medium text-accent-foreground bg-accent hover:bg-accent/90 rounded-lg transition-colors">
                        Показати
                    </button>
                </div>
            </div>
        </div>
    );
}