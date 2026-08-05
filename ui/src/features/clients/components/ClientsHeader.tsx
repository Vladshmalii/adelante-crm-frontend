import { Plus } from 'lucide-react';
import { ExcelDropdown } from '@/shared/components/ui/ExcelDropdown';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { Button } from '@/shared/components/ui/Button';

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
        <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="w-full sm:max-w-md">
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Пошук клієнта..."
                    />
                </div>
                <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                    <ExcelDropdown onImport={onImportExcel} onExport={onExportExcel} />
                    <Button
                        onClick={onAddClient}
                        variant="primary"
                        className="flex h-10 items-center gap-2 rounded-xl px-6 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        Додати клієнта
                    </Button>
                </div>
            </div>
        </div>
    );
}
