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
    onCategoriesClick: () => void;
}

export function InventoryHeader({
    searchQuery,
    onSearchChange,
    onAddProduct,
    onImport,
    onExport,
    onCategoriesClick,
}: InventoryHeaderProps) {
    return (
        <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="w-full sm:w-72">
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Пошук товару..."
                    />
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                    <ExcelDropdown onImport={onImport} onExport={onExport} />
                    <Button
                        variant="outline"
                        onClick={onCategoriesClick}
                        className="flex-1 sm:flex-none"
                    >
                        Категорії
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onAddProduct}
                        className="flex-1 sm:flex-none"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Додати товар
                    </Button>
                </div>
            </div>
        </div>
    );
}
