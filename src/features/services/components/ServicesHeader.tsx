'use client';

import { Plus } from 'lucide-react';
import { SearchInput } from '@/shared/components/ui/SearchInput';

interface ServicesHeaderProps {
    onAddService: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export function ServicesHeader({
    onAddService,
    searchQuery,
    onSearchChange,
}: ServicesHeaderProps) {
    return (
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="w-full sm:max-w-md">
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onClear={() => onSearchChange('')}
                        placeholder="Пошук послуг..."
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                        onClick={onAddService}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-accent-foreground bg-accent hover:bg-accent/90 rounded-lg transition-colors"
                    >
                        <Plus size={18} />
                        Додати послугу
                    </button>
                </div>
            </div>
        </div>
    );
}
