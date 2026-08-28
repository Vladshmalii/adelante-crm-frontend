import { Plus } from 'lucide-react';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { Button } from '@/shared/components/ui/Button';

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
                        <Button onClick={onAddNew} leftIcon={<Plus size={18} />}>
                            {addButtonLabel}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
