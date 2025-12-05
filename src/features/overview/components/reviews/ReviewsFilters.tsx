import { Dropdown } from '@/shared/components/ui/Dropdown';
import { RangeDatePicker } from '@/shared/components/ui/RangeDatePicker';
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
        <div className="space-y-4 mb-6">
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
                    <button className="w-full px-4 py-2 text-sm font-medium text-accent-foreground bg-accent hover:bg-accent/90 rounded-lg transition-colors">
                        Показати
                    </button>
                </div>
            </div>
        </div>
    );
}