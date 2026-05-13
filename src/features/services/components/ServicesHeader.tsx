'use client';

import { Plus } from 'lucide-react';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { Button } from '@/shared/components/ui/Button';

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
        <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                <div>
                    <h1 className="text-3xl font-black text-foreground font-heading tracking-tight mb-1">
                        Послуги
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Керуйте списком послуг, цінами та тривалістю процедур
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
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
                        className="h-[46px] px-8 rounded-2xl font-bold flex items-center gap-2 w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 active:scale-95"
                    >
                        <Plus size={20} />
                        Створити послугу
                    </Button>
                </div>
            </div>
        </div>
    );
}
