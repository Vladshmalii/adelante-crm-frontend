import { Dropdown } from '@/shared/components/ui/Dropdown';
import { PRODUCT_CATEGORIES, PRODUCT_TYPES, STOCK_STATUSES } from '../constants';
import { InventoryFilters as FilterType } from '../types';

interface InventoryFiltersProps {
    filters: FilterType;
    onFiltersChange: (filters: FilterType) => void;
}

export function InventoryFilters({ filters, onFiltersChange }: InventoryFiltersProps) {
    const handleChange = (key: keyof FilterType, value: any) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 bg-card rounded-lg border border-border">
            <Dropdown
                label="Категорія"
                value={filters.category || 'all'}
                options={[{ value: 'all', label: 'Всі категорії' }, ...PRODUCT_CATEGORIES]}
                onChange={(val) => handleChange('category', val)}
            />
            <Dropdown
                label="Тип товару"
                value={filters.type || 'all'}
                options={[{ value: 'all', label: 'Всі типи' }, ...PRODUCT_TYPES]}
                onChange={(val) => handleChange('type', val)}
            />
            <Dropdown
                label="Статус наявності"
                value={filters.stockStatus || 'all'}
                options={[{ value: 'all', label: 'Всі статуси' }, ...STOCK_STATUSES]}
                onChange={(val) => handleChange('stockStatus', val)}
            />
        </div>
    );
}
