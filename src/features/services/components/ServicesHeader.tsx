'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
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
        <div className="px-4 sm:px-6 py-4 border-b border-border bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="w-full sm:w-64">
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onClear={() => onSearchChange('')}
                        placeholder="Пошук послуг..."
                    />
                </div>
                <Button
                    onClick={onAddService}
                    variant="primary"
                    className="whitespace-nowrap"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Додати послугу
                </Button>
            </div>
        </div>
    );
}
