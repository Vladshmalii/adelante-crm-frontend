import { RecordRow } from './RecordRow';
import type { Record } from '../../types';

interface RecordsTableProps {
    records: Record[];
    onView: (record: Record) => void;
}

export function RecordsTable({ records, onView }: RecordsTableProps) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card shadow-sm">
            <table className="w-full">
                <thead className="border-b border-border/50 bg-secondary/20">
                    <tr>
                        <th className="w-[140px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Дата створення
                        </th>
                        <th className="w-[160px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Співробітник
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Послуга
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Клієнт
                        </th>
                        <th className="w-[140px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Час візиту
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Хто створив
                        </th>
                        <th className="w-[100px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Ціна
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Статус візиту
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Оплата
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Джерело
                        </th>
                        <th className="w-[60px] px-4 py-4 text-right text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Дії
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                    {records.map((record, index) => (
                        <RecordRow
                            key={record.id}
                            record={record}
                            isEven={index % 2 === 0}
                            onView={onView}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
