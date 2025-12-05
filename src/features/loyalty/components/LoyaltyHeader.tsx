import { Plus } from 'lucide-react';
import { SearchInput } from '@/shared/components/ui/SearchInput';

interface LoyaltyHeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAddNew: () => void;
    addButtonLabel: string;
    showAddButton?: boolean;
}

export function LoyaltyHeader({
    searchQuery,
    onSearchChange,
    onAddNew,
    addButtonLabel,
    showAddButton = true,
}: LoyaltyHeaderProps) {
    return (
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="w-full sm:max-w-md">
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Пошук..."
                    />
                </div>
                {showAddButton && (
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            onClick={onAddNew}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-accent-foreground bg-accent hover:bg-accent/90 rounded-lg transition-colors"
                        >
                            <Plus size={18} />
                            {addButtonLabel}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
