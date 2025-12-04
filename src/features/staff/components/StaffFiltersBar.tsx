'use client';

import { X } from 'lucide-react';
import { Dropdown } from '@/shared/components/ui/Dropdown';
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
    const handleFilterChange = (key: keyof StaffFilters, value: string | number) => {
        onFiltersChange({ ...filters, [key]: value || undefined } as StaffFilters);
    };

    const hasActiveFilters = Object.values(filters).some((v) => v);

    return (
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
            <span className="text-sm font-medium text-foreground">Фільтри:</span>

            <div className="flex items-center gap-3">
                <div className="w-48">
                    <Dropdown
                        placeholder="За посадою"
                        value={filters.role || ''}
                        options={[
                            { value: '', label: 'Всі' },
                            { value: 'Майстри', label: 'Майстри' },
                            { value: 'Адміністратори', label: 'Адміністратори' },
                            { value: 'Менеджери', label: 'Менеджери' },
                        ]}
                        onChange={(value) => handleFilterChange('role', value)}
                    />
                </div>

                <div className="w-56">
                    <Dropdown
                        placeholder="За зарплатою"
                        value={filters.salary || ''}
                        options={[
                            { value: '', label: 'Всі' },
                            { value: 'Більше 20000₴', label: 'Більше 20000₴' },
                            { value: '15000-20000₴', label: '15000-20000₴' },
                            { value: 'Менше 15000₴', label: 'Менше 15000₴' },
                        ]}
                        onChange={(value) => handleFilterChange('salary', value)}
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
