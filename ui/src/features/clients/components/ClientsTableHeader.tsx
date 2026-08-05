import { Lock } from 'lucide-react';
import { Checkbox } from '@/shared/components/ui/Checkbox';

interface ClientsTableHeaderProps {
    allSelected: boolean;
    onToggleAll: () => void;
}

export function ClientsTableHeader({ allSelected, onToggleAll }: ClientsTableHeaderProps) {
    return (
        <thead className="border-b border-border/50 bg-secondary/20">
            <tr>
                <th className="w-12 px-4 py-4">
                    <Checkbox checked={allSelected} onChange={onToggleAll} />
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                    Ім&apos;я
                </th>
                <th className="hidden px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 md:table-cell">
                    Сегмент
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                    <div className="flex items-center gap-1.5">
                        Телефон
                        <Lock size={12} className="opacity-50" />
                    </div>
                </th>
                <th className="hidden px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 xl:table-cell">
                    <div className="flex items-center gap-1.5">
                        Email
                        <Lock size={12} className="opacity-50" />
                    </div>
                </th>
                <th className="hidden px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 lg:table-cell">
                    <div className="flex items-center gap-1.5">
                        Продано
                        <Lock size={12} className="opacity-50" />
                    </div>
                </th>
                <th className="hidden px-4 py-4 text-center text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 lg:table-cell">
                    Візити
                </th>
                <th className="hidden px-4 py-4 text-center text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 xl:table-cell">
                    Знижка
                </th>
                <th className="hidden px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 lg:table-cell">
                    Останній візит
                </th>
                <th className="hidden px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 xl:table-cell">
                    Перший візит
                </th>
                <th className="w-12 px-4 py-4"></th>
            </tr>
        </thead>
    );
}
