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
        <div className="mb-6 rounded-2xl border border-border/50 bg-secondary/30 p-5">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <SlidersHorizontal size={18} />
                    </div>
                    <h3 className="font-bold text-foreground">Параметри фільтрації</h3>
                </div>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        className="h-8 gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-destructive"
                    >
                        <X size={14} />
                        Очистити
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
