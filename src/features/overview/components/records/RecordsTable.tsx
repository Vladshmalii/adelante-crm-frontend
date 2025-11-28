import { RecordRow } from './RecordRow';
import type { Record } from '../../types';

interface RecordsTableProps {
    records: Record[];
}

export function RecordsTable({ records }: RecordsTableProps) {
    return (
        <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full">
                <thead className="bg-secondary border-b border-border">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Співробітник
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Послуга
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Клієнт
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Час візиту
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Хто створив
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Статус візиту
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Оплата
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Джерело
                    </th>
                    <th className="w-12 px-4 py-3"></th>
                </tr>
                </thead>
                <tbody>
                {records.map((record, index) => (
                    <RecordRow key={record.id} record={record} isEven={index % 2 === 0} />
                ))}
                </tbody>
            </table>
        </div>
    );
}