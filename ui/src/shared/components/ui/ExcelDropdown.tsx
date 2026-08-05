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

    const toggleDropdown = () => {
        setIsOpen((prev) => !prev);
    };

    const handleImport = () => {
        setIsOpen(false);
        onImport();
    };

    const handleExport = () => {
        setIsOpen(false);
        onExport();
    };

    return (
        <div ref={dropdownRef} className="relative inline-block">
            <button
                onClick={toggleDropdown}
                className="flex h-10 items-center gap-2 rounded-xl border border-border/50 bg-secondary/50 px-4 text-sm font-bold text-foreground transition-all hover:bg-secondary/80 active:scale-95"
            >
                <FileSpreadsheet size={18} />
                Операції з Excel
            </button>
            {isOpen && (
                <div className="animate-in fade-in zoom-in-95 absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-card shadow-lg duration-100">
                    <button
                        onClick={handleImport}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-secondary"
                    >
                        <Upload size={18} className="text-muted-foreground" />
                        Завантажити з Excel
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-sm text-foreground transition-colors hover:bg-secondary"
                    >
                        <Download size={18} className="text-muted-foreground" />
                        Вивантажити в Excel
                    </button>
                </div>
            )}
        </div>
    );
}
