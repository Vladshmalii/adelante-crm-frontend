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
        <div className="mb-6 pb-4 border-b border-border">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="w-full grid grid-cols-2 sm:flex sm:flex-row gap-3">
                    <div className="w-full sm:w-48">
                        <Dropdown
                            placeholder="За посадою"
                            value={filters.role || ''}
                            options={[
                                { value: '', label: 'Всі' },
                                { value: 'master', label: 'Майстри' },
                                { value: 'administrator', label: 'Адміністратори' },
                                { value: 'manager', label: 'Менеджери' },
                            ]}
                            onChange={(value) => handleFilterChange('role', value)}
                        />
                    </div>

                    <div className="w-full sm:w-56">
                        <Dropdown
                            placeholder="За зарплатою"
                            value={filters.salary || ''}
                            options={[
                                { value: '', label: 'Всі' },
                                { value: '20000', label: 'Більше 20000₴' },
                                { value: '15000-20000', label: '15000-20000₴' },
                                { value: '15000', label: 'Менше 15000₴' },
                            ]}
                            onChange={(value) => handleFilterChange('salary', value)}
                        />
                    </div>
                </div>

                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                        <X size={16} />
                        Очистити
                    </button>
                )}
            </div>
        </div>
    );
}
