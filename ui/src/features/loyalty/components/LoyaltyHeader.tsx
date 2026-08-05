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
        <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="w-full sm:max-w-md">
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Пошук..."
                    />
                </div>
                {showAddButton && (
                    <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                        <Button onClick={onAddNew} leftIcon={<Plus size={18} />}>
                            {addButtonLabel}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
