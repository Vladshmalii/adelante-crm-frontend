import { X } from 'lucide-react';
import { Dropdown } from '@/shared/components/ui/Dropdown';
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
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
            <span className="text-sm font-medium text-foreground">Фільтри:</span>

            <div className="flex items-center gap-3">
                <div className="w-48">
                    <Dropdown
                        placeholder="За візитами"
                        value={filters.visits || ''}
                        options={[
                            { value: '', label: 'Всі' },
                            { value: 'Більше 10', label: 'Більше 10' },
                            { value: '5-10', label: '5-10' },
                            { value: 'Менше 5', label: 'Менше 5' },
                        ]}
                        onChange={(value) => handleFilterChange('visits', value)}
                    />
                </div>

                <div className="w-48">
                    <Dropdown
                        placeholder="За клієнтами"
                        value={filters.clients || ''}
                        options={[
                            { value: '', label: 'Всі' },
                            { value: 'VIP', label: 'VIP' },
                            { value: 'Зі знижкою', label: 'Зі знижкою' },
                            { value: 'Без знижки', label: 'Без знижки' },
                        ]}
                        onChange={(value) => handleFilterChange('clients', value)}
                    />
                </div>

                <div className="w-56">
                    <Dropdown
                        placeholder="За продажами"
                        value={filters.sales || ''}
                        options={[
                            { value: '', label: 'Всі' },
                            { value: 'Більше 20000₴', label: 'Більше 20000₴' },
                            { value: '10000-20000₴', label: '10000-20000₴' },
                            { value: 'Менше 10000₴', label: 'Менше 10000₴' },
                        ]}
                        onChange={(value) => handleFilterChange('sales', value)}
                    />
                </div>
            </div>

            {hasActiveFilters && (
                <button
                    onClick={onClearFilters}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X size={16} />
                    Очистити
                </button>
            )}
        </div>
    );
}