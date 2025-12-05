'use client';

import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Input } from '@/shared/components/ui/Input';
import { SERVICE_CATEGORIES, SERVICE_STATUSES } from '../constants';
import type { ServiceFilters } from '../types';

interface ServicesFiltersProps {
    filters: ServiceFilters;
    onFiltersChange: (filters: ServiceFilters) => void;
}

export function ServicesFilters({ filters, onFiltersChange }: ServicesFiltersProps) {
    const updateFilter = (key: keyof ServiceFilters, value: any) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    return (
        <div className="mb-6 pb-4 border-b border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Dropdown
                    label="Категорія"
                    value={filters.category || ''}
                    options={[
                        { value: '', label: 'Всі категорії' },
                        ...SERVICE_CATEGORIES
                    ]}
                    onChange={(value) => updateFilter('category', value)}
                />

                <Dropdown
                    label="Статус"
                    value={filters.status || ''}
                    options={[
                        { value: '', label: 'Всі статуси' },
                        ...SERVICE_STATUSES
                    ]}
                    onChange={(value) => updateFilter('status', value)}
                />

                <Input
                    label="Ціна від (₴)"
                    type="number"
                    min="0"
                    value={filters.priceFrom || ''}
                    onChange={(e) => updateFilter('priceFrom', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0"
                />

                <Input
                    label="Ціна до (₴)"
                    type="number"
                    min="0"
                    value={filters.priceTo || ''}
                    onChange={(e) => updateFilter('priceTo', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="10000"
                />
            </div>
        </div>
    );
}
