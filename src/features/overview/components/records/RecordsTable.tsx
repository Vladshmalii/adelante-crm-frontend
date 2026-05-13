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
                <thead className="bg-secondary/20 border-b border-border/50">
                    <tr>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[140px]">
                            Дата створення
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[160px]">
                            Співробітник
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                            Послуга
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                            Клієнт
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[140px]">
                            Час візиту
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                            Хто створив
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[100px]">
                            Ціна
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                            Статус візиту
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                            Оплата
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                            Джерело
                        </th>
                        <th className="px-4 py-4 text-right text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest w-[60px]">Дії</th>
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