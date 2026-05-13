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
        <thead className="bg-secondary/20 border-b border-border/50">
            <tr>
                <th className="w-12 px-4 py-4">
                    <Checkbox
                        checked={allSelected}
                        onChange={onToggleAll}
                    />
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                    Ім&apos;я
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest hidden md:table-cell">
                    Сегмент
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                        Телефон
                        <Lock size={12} className="opacity-50" />
                    </div>
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest hidden xl:table-cell">
                    <div className="flex items-center gap-1.5">
                        Email
                        <Lock size={12} className="opacity-50" />
                    </div>
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest hidden lg:table-cell">
                    <div className="flex items-center gap-1.5">
                        Продано
                        <Lock size={12} className="opacity-50" />
                    </div>
                </th>
                <th className="px-4 py-4 text-center text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest hidden lg:table-cell">
                    Візити
                </th>
                <th className="px-4 py-4 text-center text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest hidden xl:table-cell">
                    Знижка
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest hidden lg:table-cell">
                    Останній візит
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest hidden xl:table-cell">
                    Перший візит
                </th>
                <th className="w-12 px-4 py-4"></th>
            </tr>
        </thead>
    );
}