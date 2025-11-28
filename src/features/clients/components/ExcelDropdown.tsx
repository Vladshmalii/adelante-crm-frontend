import { FileSpreadsheet, Upload, Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ExcelDropdownProps {
    onImport: () => void;
    onExport: () => void;
}

export function ExcelDropdown({ onImport, onExport }: ExcelDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleImport = () => {
        setIsOpen(false);
        onImport();
    };

    const handleExport = () => {
        setIsOpen(false);
        onExport();
    };

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
            >
                <FileSpreadsheet size={18} />
                Операції з Excel
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                    <button
                        onClick={handleImport}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                        <Upload size={18} className="text-muted-foreground" />
                        Завантажити з Excel
                    </button>
                    <button
                        onClick={handleExport}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors border-t border-border"
                    >
                        <Download size={18} className="text-muted-foreground" />
                        Вивантажити в Excel
                    </button>
                </div>
            )}
        </div>
    );
}