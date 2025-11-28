import { Dropdown } from '@/shared/components/ui/Dropdown';
import { DatePicker } from '@/shared/components/ui/DatePicker';
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
            </div>

            <div className="flex justify-end">
                <button className="px-6 py-2 text-sm font-medium text-accent-foreground bg-accent hover:bg-accent/90 rounded-lg transition-colors">
                    Показати
                </button>
            </div>
        </div>
    );
}