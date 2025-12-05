import { Lock } from 'lucide-react';
import { Checkbox } from '@/shared/components/ui/Checkbox';

interface ClientsTableHeaderProps {
    allSelected: boolean;
    onToggleAll: () => void;
}

export function ClientsTableHeader({
    allSelected,
    onToggleAll,
}: ClientsTableHeaderProps) {
    return (
        <thead className="bg-secondary border-b border-border">
            <tr>
                <th className="w-12 px-4 py-3">
                    <Checkbox
                        checked={allSelected}
                        onChange={onToggleAll}
                    />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Ім&apos;я
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    Сегмент
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                        Телефон
                        <Lock size={14} />
                    </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                    <div className="flex items-center gap-1.5">
                        Email
                        <Lock size={14} />
                    </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    <div className="flex items-center gap-1.5">
                        Продано
                        <Lock size={14} />
                    </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    Візити
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                    Знижка
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    Останній візит
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                    Перший візит
                </th>
                <th className="w-12 px-4 py-3"></th>
            </tr>
        </thead>
    );
}