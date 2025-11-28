'use client';

import { ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
import type { StaffFilters } from '../types';

interface StaffFiltersBarProps {
    filters: StaffFilters;
    onFiltersChange: (filters: StaffFilters) => void;
    onClearFilters: () => void;
}

export function StaffFiltersBar({
    filters,
    onFiltersChange,
    onClearFilters,
}: StaffFiltersBarProps) {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const handleFilterChange = (key: keyof StaffFilters, value: string) => {
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
                        setOpenDropdown(openDropdown === 'role' ? null : 'role')
                    }
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                >
                    За посадою
                    <ChevronDown size={16} />
                </button>
                {openDropdown === 'role' && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-10">
                        {['Всі', 'Майстри', 'Адміністратори', 'Менеджери'].map((option) => (
                            <button
                                key={option}
                                onClick={() => handleFilterChange('role', option)}
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
                        setOpenDropdown(openDropdown === 'salary' ? null : 'salary')
                    }
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                >
                    За зарплатою
                    <ChevronDown size={16} />
                </button>
                {openDropdown === 'salary' && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-10">
                        {['Всі', 'Більше 20000₴', '15000-20000₴', 'Менше 15000₴'].map(
                            (option) => (
                                <button
                                    key={option}
                                    onClick={() => handleFilterChange('salary', option)}
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
