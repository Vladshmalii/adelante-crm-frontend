import { Plus } from 'lucide-react';
import { ExcelDropdown } from '@/shared/components/ui/ExcelDropdown';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { Button } from '@/shared/components/ui/Button';

interface StaffHeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAddStaff: () => void;
    onImportExcel: () => void;
    onExportExcel: () => void;
}

export function StaffHeader({
    searchQuery,
    onSearchChange,
    onAddStaff,
    onImportExcel,
    onExportExcel,
}: StaffHeaderProps) {
    return (
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="w-full sm:max-w-md">
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Пошук співробітника..."
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <ExcelDropdown onImport={onImportExcel} onExport={onExportExcel} />
                    <Button
                        onClick={onAddStaff}
                        variant="primary"
                        className="h-10 px-6 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        Додати співробітника
                    </Button>
                </div>
            </div>
        </div>
    );
}
