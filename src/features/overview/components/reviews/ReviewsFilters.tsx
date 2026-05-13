import { Dropdown } from '@/shared/components/ui/Dropdown';
import { RangeDatePicker } from '@/shared/components/ui/RangeDatePicker';
import { Button } from '@/shared/components/ui/Button';
import { SlidersHorizontal } from 'lucide-react';
import { REVIEW_TYPES, REVIEW_RATINGS } from '../../constants';
import type { ReviewsFilters as Filters } from '../../types';

interface ReviewsFiltersProps {
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
}

export function ReviewsFilters({ filters, onFiltersChange }: ReviewsFiltersProps) {
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
                    label="Тип відгуку"
                    value={filters.type || 'all'}
                    options={REVIEW_TYPES}
                    onChange={(value) => updateFilter('type', value)}
                />
                <Dropdown
                    label="Оцінка"
                    value={filters.rating || ''}
                    options={REVIEW_RATINGS}
                    onChange={(value) => updateFilter('rating', value)}
                />
                <div className="flex items-end">
                    <Button 
                        variant="primary"
                        className="h-[42px] w-full rounded-xl font-bold shadow-lg shadow-primary/10 active:scale-95 transition-all"
                    >
                        Показати відгуки
                    </Button>
                </div>
            </div>
        </div>
    );
}