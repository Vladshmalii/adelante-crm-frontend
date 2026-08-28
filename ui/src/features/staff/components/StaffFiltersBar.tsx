import { X, SlidersHorizontal } from 'lucide-react';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Button } from '@/shared/components/ui/Button';
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
        <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50 mb-6">
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
                    label="Посада"
                    placeholder="Всі посади"
                    value={filters.role || ''}
                    options={[
                        { value: '', label: 'Всі посади' },
                        { value: 'master', label: 'Майстри' },
                        { value: 'administrator', label: 'Адміністратори' },
                        { value: 'manager', label: 'Менеджери' },
                    ]}
                    onChange={(value) => handleFilterChange('role', value)}
                />

                <Dropdown
                    label="Заробітна плата"
                    placeholder="Всі суми"
                    value={filters.salary || ''}
                    options={[
                        { value: '', label: 'Всі суми' },
                        { value: '20000', label: 'Більше 20 000 ₴' },
                        { value: '15000-20000', label: '15 000 - 20 000 ₴' },
                        { value: '15000', label: 'Менше 15 000 ₴' },
                    ]}
                    onChange={(value) => handleFilterChange('salary', value)}
                />
            </div>
        </div>
    );
}
