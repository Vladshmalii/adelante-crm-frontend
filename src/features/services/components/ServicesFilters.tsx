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
    onAddService
}: ServicesFiltersProps) {
    const updateFilter = (key: keyof ServiceFilters, value: any) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    return (
        <div className="p-6 rounded-[22px] bg-secondary/30 border border-border/50 mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-6 border-b border-border/50">
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
                    className="h-[46px] px-8 rounded-2xl font-bold flex items-center gap-2 w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 active:scale-95"
                >
                    <Plus size={20} />
                    Створити послугу
                </Button>
            </div>

            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <SlidersHorizontal size={18} />
                </div>
                <h3 className="font-bold text-foreground">Фільтри</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
