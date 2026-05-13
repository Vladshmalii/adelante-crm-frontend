import { ChangeRow } from './ChangeRow';
import type { Change } from '../../types';

interface ChangesTableProps {
    changes: Change[];
    onView: (change: Change) => void;
}

export function ChangesTable({ changes, onView }: ChangesTableProps) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card shadow-sm">
            <table className="w-full">
                <thead className="bg-secondary/20 border-b border-border/50">
                    <tr>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[140px]">
                            Дата
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[180px]">
                            Сутність
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[160px]">
                            Автор зміни
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[120px]">
                            Дія
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                            Деталі
                        </th>
                        <th className="px-4 py-4 text-right text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[80px]">Дії</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                    {changes.map((change, index) => (
                        <ChangeRow 
                            key={change.id} 
                            change={change} 
                            isEven={index % 2 === 0} 
                            onView={onView}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}