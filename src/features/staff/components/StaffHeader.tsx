import { Search, Info, Plus } from 'lucide-react';
import { ExcelDropdown } from './ExcelDropdown';

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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold text-foreground">
                        Співробітники
                    </h1>
                    <button
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Інформація"
                    >
                        <Info size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <ExcelDropdown onImport={onImportExcel} onExport={onExportExcel} />

                    <button
                        onClick={onAddStaff}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-accent-foreground bg-accent hover:bg-accent/90 rounded-lg transition-colors"
                    >
                        <Plus size={18} />
                        Додати співробітника
                    </button>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={20}
                />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Пошук (за ім'ям, телефоном або Email)"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                />
            </div>
        </div>
    );
}
