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
                    Ім&apos;я
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Телефон
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                    Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    Посада
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    Спеціалізація
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    Зарплата
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                    Комісія
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                    Дата прийому
                </th>
                <th className="w-12 px-4 py-3"></th>
            </tr>
        </thead>
    );
}
