import { Dropdown } from '@/shared/components/ui/Dropdown';
import { RangeDatePicker } from '@/shared/components/ui/RangeDatePicker';
import { Button } from '@/shared/components/ui/Button';
import { SlidersHorizontal } from 'lucide-react';
import { RECORD_STATUSES, PAYMENT_STATUSES, RECORD_SOURCES } from '../../constants';
import type { RecordsFilters as Filters } from '../../types';

interface RecordsFiltersProps {
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
}

const EMPLOYEES = [
    { value: '', label: 'Всі співробітники' },
    { value: 'Олена Коваль', label: 'Олена Коваль' },
    { value: 'Іван Мельник', label: 'Іван Мельник' },
    { value: 'Наталія Ткаченко', label: 'Наталія Ткаченко' },
];

const SERVICE_CATEGORIES = [
    { value: '', label: 'Всі категорії' },
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
        <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50 mb-6 mx-4">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <SlidersHorizontal size={18} />
                </div>
                <h3 className="font-bold text-foreground">Параметри фільтрації</h3>
            </div>

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
                <Dropdown
                    label="Статус візиту"
                    value={filters.visitStatus || ''}
                    options={[
                        { value: '', label: 'Всі статуси' },
                        ...RECORD_STATUSES.map(s => ({ value: s.value, label: s.label })),
                    ]}
                    onChange={(value) => updateFilter('visitStatus', value)}
                />
                <Dropdown
                    label="Статус оплати"
                    value={filters.paymentStatus || ''}
                    options={[
                        { value: '', label: 'Всі статуси' },
                        ...PAYMENT_STATUSES.map(s => ({ value: s.value, label: s.label })),
                    ]}
                    onChange={(value) => updateFilter('paymentStatus', value)}
                />
                <Dropdown
                    label="Джерело запису"
                    value={filters.source || ''}
                    options={[
                        { value: '', label: 'Всі джерела' },
                        ...RECORD_SOURCES.map(s => ({ value: s.value, label: s.label })),
                    ]}
                    onChange={(value) => updateFilter('source', value)}
                />
                <div className="flex items-end">
                    <Button 
                        variant="primary"
                        className="h-[42px] w-full rounded-xl font-bold shadow-lg shadow-primary/10 active:scale-95 transition-all"
                    >
                        Показати записи
                    </Button>
                </div>
            </div>
        </div>
    );
}