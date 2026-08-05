'use client';

import { Plus } from 'lucide-react';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { Button } from '@/shared/components/ui/Button';

interface ServicesHeaderProps {
    onAddService: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export function ServicesHeader({ onAddService, searchQuery, onSearchChange }: ServicesHeaderProps) {
    return (
        <div className="mb-8 flex flex-col gap-6">
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
                <div>
                    <h1 className="mb-1 font-heading text-3xl font-black tracking-tight text-foreground">
                        Послуги
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Керуйте списком послуг, цінами та тривалістю процедур
                    </p>
                </div>

                <div className="flex w-full flex-col items-center gap-4 sm:flex-row lg:w-auto">
                    <div className="w-full sm:w-[350px]">
                        <SearchInput
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onClear={() => onSearchChange('')}
                            placeholder="Знайти послугу..."
                        />
                    </div>
                    <Button
                        onClick={onAddService}
                        variant="primary"
                        className="flex h-[46px] w-full items-center gap-2 rounded-2xl px-8 font-bold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 active:scale-95 sm:w-auto"
                    >
                        <Plus size={20} />
                        Створити послугу
                    </Button>
                </div>
            </div>
        </div>
    );
}
