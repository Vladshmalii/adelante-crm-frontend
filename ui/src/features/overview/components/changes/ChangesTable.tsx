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
                <thead className="border-b border-border/50 bg-secondary/20">
                    <tr>
                        <th className="w-[140px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Дата
                        </th>
                        <th className="w-[180px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Сутність
                        </th>
                        <th className="w-[160px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Автор зміни
                        </th>
                        <th className="w-[120px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Дія
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Деталі
                        </th>
                        <th className="w-[80px] px-4 py-4 text-right text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Дії
                        </th>
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
