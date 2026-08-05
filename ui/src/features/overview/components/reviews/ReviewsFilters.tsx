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
        <div className="mx-4 mb-6 rounded-2xl border border-border/50 bg-secondary/30 p-5">
            <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <SlidersHorizontal size={18} />
                </div>
                <h3 className="font-bold text-foreground">Параметри фільтрації</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                        className="h-[42px] w-full rounded-xl font-bold shadow-lg shadow-primary/10 transition-all active:scale-95"
                    >
                        Показати відгуки
                    </Button>
                </div>
            </div>
        </div>
    );
}
