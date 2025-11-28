import { ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
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
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const handleFilterChange = (key: keyof ClientFilters, value: string) => {
        onFiltersChange({ ...filters, [key]: value });
        setOpenDropdown(null);
    };

    const hasActiveFilters = Object.values(filters).some((v) => v);

    return (
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
            <span className="text-sm font-medium text-foreground">Фільтри:</span>

            <div className="relative">
                <button
                    onClick={() =>
                        setOpenDropdown(openDropdown === 'visits' ? null : 'visits')
                    }
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                >
                    За візитами
                    <ChevronDown size={16} />
                </button>
                {openDropdown === 'visits' && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-10">
                        {['Всі', 'Більше 10', '5-10', 'Менше 5'].map((option) => (
                            <button
                                key={option}
                                onClick={() => handleFilterChange('visits', option)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="relative">
                <button
                    onClick={() =>
                        setOpenDropdown(openDropdown === 'clients' ? null : 'clients')
                    }
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                >
                    За клієнтами
                    <ChevronDown size={16} />
                </button>
                {openDropdown === 'clients' && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-10">
                        {['Всі', 'VIP', 'Зі знижкою', 'Без знижки'].map((option) => (
                            <button
                                key={option}
                                onClick={() => handleFilterChange('clients', option)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="relative">
                <button
                    onClick={() =>
                        setOpenDropdown(openDropdown === 'sales' ? null : 'sales')
                    }
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                >
                    За продажами
                    <ChevronDown size={16} />
                </button>
                {openDropdown === 'sales' && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-10">
                        {['Всі', 'Більше 20000₴', '10000-20000₴', 'Менше 10000₴'].map(
                            (option) => (
                                <button
                                    key={option}
                                    onClick={() => handleFilterChange('sales', option)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg"
                                >
                                    {option}
                                </button>
                            )
                        )}
                    </div>
                )}
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