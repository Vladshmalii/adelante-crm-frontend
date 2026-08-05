'use client';

import { Dropdown } from '@/shared/components/ui/Dropdown';
import { NumberInput } from '@/shared/components/ui/NumberInput';
import { Button } from '@/shared/components/ui/Button';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { SERVICE_CATEGORIES, SERVICE_STATUSES } from '../constants';
import type { ServiceFilters } from '../types';
import { SlidersHorizontal, Plus } from 'lucide-react';

interface ServicesFiltersProps {
    filters: ServiceFilters;
    onFiltersChange: (filters: ServiceFilters) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAddService: () => void;
}

export function ServicesFilters({
    filters,
    onFiltersChange,
    searchQuery,
    onSearchChange,
    onAddService,
}: ServicesFiltersProps) {
    const updateFilter = (key: keyof ServiceFilters, value: any) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    return (
        <div className="mb-8 rounded-[22px] border border-border/50 bg-secondary/30 p-6">
            <div className="mb-6 flex flex-col items-center justify-between gap-4 border-b border-border/50 pb-6 sm:flex-row">
                <div className="w-full sm:w-[400px]">
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onClear={() => onSearchChange('')}
                        placeholder="Знайти послугу за назвою..."
                    />
                </div>
                <Button
                    onClick={onAddService}
                    variant="primary"
                    className="flex h-[46px] w-full items-center gap-2 rounded-2xl px-8 font-bold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 active:scale-95 sm:w-auto"
                >
                    <Plus size={20} />
                    Створити послугу
                </Button>
            </div>

            <div className="mb-6 flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <SlidersHorizontal size={18} />
                </div>
                <h3 className="font-bold text-foreground">Фільтри</h3>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Dropdown
                    label="Категорія"
                    value={filters.category || ''}
                    options={[{ value: '', label: 'Всі категорії' }, ...SERVICE_CATEGORIES]}
                    onChange={(value) => updateFilter('category', value)}
                />

                <Dropdown
                    label="Статус"
                    value={filters.status || ''}
                    options={[{ value: '', label: 'Всі статуси' }, ...SERVICE_STATUSES]}
                    onChange={(value) => updateFilter('status', value)}
                />

                <NumberInput
                    label="Ціна від (₴)"
                    value={filters.priceFrom || 0}
                    step={50}
                    onChange={(val) => updateFilter('priceFrom', val)}
                    placeholder="Від 0"
                />

                <NumberInput
                    label="Ціна до (₴)"
                    value={filters.priceTo || 0}
                    step={50}
                    onChange={(val) => updateFilter('priceTo', val)}
                    placeholder="До 10 000"
                />
            </div>
        </div>
    );
}
