import { X, SlidersHorizontal } from 'lucide-react';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Button } from '@/shared/components/ui/Button';
import type { ClientFilters } from '../types';

interface ClientsFiltersBarProps {
    filters: ClientFilters;
    onFiltersChange: (filters: ClientFilters) => void;
    onClearFilters: () => void;
}

export function ClientsFiltersBar({
    filters,
    onFiltersChange,
    onClearFilters,
}: ClientsFiltersBarProps) {
    const handleFilterChange = (key: keyof ClientFilters, value: string | number) => {
        onFiltersChange({ ...filters, [key]: value || undefined } as ClientFilters);
    };

    const hasActiveFilters = Object.values(filters).some((v) => v);

    return (
        <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50 mb-6 mx-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <SlidersHorizontal size={18} />
                    </div>
                    <h3 className="font-bold text-foreground">Параметри фільтрації</h3>
                </div>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        className="h-8 text-xs font-bold text-muted-foreground hover:text-destructive transition-colors gap-1.5"
                    >
                        <X size={14} />
                        Очистити
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Dropdown
                    label="Візити"
                    placeholder="Всі візити"
                    value={filters.visits || ''}
                    options={[
                        { value: '', label: 'Всі візити' },
                        { value: 'Більше 10', label: 'Більше 10' },
                        { value: '5-10', label: '5-10' },
                        { value: 'Менше 5', label: 'Менше 5' },
                    ]}
                    onChange={(value) => handleFilterChange('visits', value)}
                />

                <Dropdown
                    label="Тип клієнта"
                    placeholder="Всі типи"
                    value={filters.clients || ''}
                    options={[
                        { value: '', label: 'Всі типи' },
                        { value: 'VIP', label: 'VIP' },
                        { value: 'Зі знижкою', label: 'Зі знижкою' },
                        { value: 'Без знижки', label: 'Без знижки' },
                    ]}
                    onChange={(value) => handleFilterChange('clients', value)}
                />

                <Dropdown
                    label="Продажі"
                    placeholder="Всі суми"
                    value={filters.sales || ''}
                    options={[
                        { value: '', label: 'Всі суми' },
                        { value: 'Більше 20000₴', label: 'Більше 20 000 ₴' },
                        { value: '10000-20000₴', label: '10 000 - 20 000 ₴' },
                        { value: 'Менше 10000₴', label: 'Менше 10 000 ₴' },
                    ]}
                    onChange={(value) => handleFilterChange('sales', value)}
                />
            </div>
        </div>
    );
}