import { Dropdown } from '@/shared/components/ui/Dropdown';
import { STOCK_STATUSES } from '../constants';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { InventoryFilters as FilterType } from '../types';
import { SlidersHorizontal } from 'lucide-react';

interface InventoryFiltersProps {
    filters: FilterType;
    onFiltersChange: (filters: FilterType) => void;
}

export function InventoryFilters({ filters, onFiltersChange }: InventoryFiltersProps) {
    const categories = useInventoryStore(state => state.categories);
    const handleChange = (key: keyof FilterType, value: any) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    return (
        <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50 mb-6 mx-4">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <SlidersHorizontal size={18} />
                </div>
                <h3 className="font-bold text-foreground">Параметри фільтрації</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Dropdown
                    label="Категорія"
                    value={filters.category || 'all'}
                    options={[{ value: 'all', label: 'Всі категорії' }, ...categories]}
                    onChange={(val) => handleChange('category', val)}
                />

                <Dropdown
                    label="Статус наявності"
                    value={filters.stockStatus || 'all'}
                    options={[{ value: 'all', label: 'Всі статуси' }, ...STOCK_STATUSES]}
                    onChange={(val) => handleChange('stockStatus', val)}
                />
            </div>
        </div>
    );
}
