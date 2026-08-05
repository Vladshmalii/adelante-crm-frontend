import { Checkbox } from '@/shared/components/ui/Checkbox';

interface StaffTableHeaderProps {
    allSelected: boolean;
    onToggleAll: () => void;
}

export function StaffTableHeader({ allSelected, onToggleAll }: StaffTableHeaderProps) {
    return (
        <thead className="border-b border-border/50 bg-secondary/20">
            <tr>
                <th className="w-[50px] px-4 py-4">
                    <Checkbox checked={allSelected} onChange={onToggleAll} />
                </th>
                <th className="w-[200px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                    Ім&apos;я
                </th>
                <th className="w-[160px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                    Телефон
                </th>
                <th className="hidden w-[200px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 xl:table-cell">
                    Email
                </th>
                <th className="hidden w-[140px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 md:table-cell">
                    Посада
                </th>
                <th className="hidden px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 lg:table-cell">
                    Спеціалізація
                </th>
                <th className="hidden w-[120px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 lg:table-cell">
                    Зарплата
                </th>
                <th className="hidden w-[100px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 xl:table-cell">
                    Комісія
                </th>
                <th className="hidden w-[140px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 xl:table-cell">
                    Дата прийому
                </th>
                <th className="w-[80px] px-4 py-4 text-right text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                    Дії
                </th>
            </tr>
        </thead>
    );
}
