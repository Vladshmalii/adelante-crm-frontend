import { Plus } from 'lucide-react';
import { ExcelDropdown } from '@/shared/components/ui/ExcelDropdown';
import { SearchInput } from '@/shared/components/ui/SearchInput';

interface ClientsHeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAddClient: () => void;
    onImportExcel: () => void;
    onExportExcel: () => void;
}

export function ClientsHeader({
    searchQuery,
    onSearchChange,
    onAddClient,
    onImportExcel,
    onExportExcel,
}: ClientsHeaderProps) {
    return (
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="w-full sm:max-w-md">
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Пошук (за ім'ям, телефоном, Email або номером картки)"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <ExcelDropdown onImport={onImportExcel} onExport={onExportExcel} />
                    <button
                        onClick={onAddClient}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-accent-foreground bg-accent hover:bg-accent/90 rounded-lg transition-colors"
                    >
                        <Plus size={18} />
                        Додати клієнта
                    </button>
                </div>
            </div>
        </div>
    );
}