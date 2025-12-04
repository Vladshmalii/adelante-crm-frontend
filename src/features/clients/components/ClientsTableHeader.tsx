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
                    Ім'я
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Сегмент
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                        Телефон
                        <Lock size={14} />
                    </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                        Email
                        <Lock size={14} />
                    </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                        Продано
                        <Lock size={14} />
                    </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Візити
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Знижка
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Останній візит
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Перший візит
                </th>
                <th className="w-12 px-4 py-3"></th>
            </tr>
        </thead>
    );
}