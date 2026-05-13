import { Dropdown } from '@/shared/components/ui/Dropdown';
import { RangeDatePicker } from '@/shared/components/ui/RangeDatePicker';
import { Button } from '@/shared/components/ui/Button';
import { SlidersHorizontal } from 'lucide-react';
import { CHANGE_ENTITIES, CHANGE_ACTIONS } from '../../constants';
import type { ChangesFilters as Filters } from '../../types';

interface ChangesFiltersProps {
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
}

const AUTHORS = [
    { value: '', label: 'Всі автори' },
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
        <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50 mb-6 mx-4">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <SlidersHorizontal size={18} />
                </div>
                <h3 className="font-bold text-foreground">Параметри фільтрації</h3>
            </div>

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
                        { value: '', label: 'Всі сутності' },
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
                        { value: '', label: 'Всі дії' },
                        ...CHANGE_ACTIONS.map(a => ({ value: a.value, label: a.label })),
                    ]}
                    onChange={(value) => updateFilter('action', value)}
                />
                <div className="lg:col-span-4 flex justify-end mt-2">
                    <Button 
                        variant="primary"
                        className="h-[42px] px-8 rounded-xl font-bold shadow-lg shadow-primary/10 active:scale-95 transition-all"
                    >
                        Показати зміни
                    </Button>
                </div>
            </div>
        </div>
    );
}