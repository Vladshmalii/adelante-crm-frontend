import { Checkbox } from '@/shared/components/ui/Checkbox';

interface StaffTableHeaderProps {
    allSelected: boolean;
    onToggleAll: () => void;
}

export function StaffTableHeader({
    allSelected,
    onToggleAll,
}: StaffTableHeaderProps) {
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
                    Телефон
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Посада
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Спеціалізація
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Зарплата
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Комісія
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Дата прийому
                </th>
                <th className="w-12 px-4 py-3"></th>
            </tr>
        </thead>
    );
}
