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
        <thead className="bg-secondary/20 border-b border-border/50">
            <tr>
                <th className="w-[50px] px-4 py-4">
                    <Checkbox
                        checked={allSelected}
                        onChange={onToggleAll}
                    />
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[200px]">
                    Ім&apos;я
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[160px]">
                    Телефон
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest hidden xl:table-cell w-[200px]">
                    Email
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest hidden md:table-cell w-[140px]">
                    Посада
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest hidden lg:table-cell">
                    Спеціалізація
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest hidden lg:table-cell w-[120px]">
                    Зарплата
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest hidden xl:table-cell w-[100px]">
                    Комісія
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest hidden xl:table-cell w-[140px]">
                    Дата прийому
                </th>
                <th className="w-[80px] px-4 py-4 text-right text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">Дії</th>
            </tr>
        </thead>
    );
}
