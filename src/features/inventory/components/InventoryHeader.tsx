import { SearchInput } from '@/shared/components/ui/SearchInput';
import { Button } from '@/shared/components/ui/Button';
import { Plus } from 'lucide-react';
import { ExcelDropdown } from '@/shared/components/ui/ExcelDropdown';

interface InventoryHeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAddProduct: () => void;
    onImport: () => void;
    onExport: () => void;
}

export function InventoryHeader({
    searchQuery,
    onSearchChange,
    onAddProduct,
    onImport,
    onExport,
}: InventoryHeaderProps) {
    return (
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="w-full sm:w-72">
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Пошук товару..."
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <ExcelDropdown onImport={onImport} onExport={onExport} />
                    <Button variant="primary" onClick={onAddProduct} className="flex-1 sm:flex-none">
                        <Plus className="w-4 h-4 mr-2" />
                        Додати товар
                    </Button>
                </div>
            </div>
        </div>
    );
}
