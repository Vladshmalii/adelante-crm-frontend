import { ChangeRow } from './ChangeRow';
import type { Change } from '../../types';

interface ChangesTableProps {
    changes: Change[];
}

export function ChangesTable({ changes }: ChangesTableProps) {
    return (
        <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full">
                <thead className="bg-secondary border-b border-border">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Дата
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Сутність
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Автор зміни
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Дія
                    </th>
                    <th className="w-12 px-4 py-3"></th>
                </tr>
                </thead>
                <tbody>
                {changes.map((change, index) => (
                    <ChangeRow key={change.id} change={change} isEven={index % 2 === 0} />
                ))}
                </tbody>
            </table>
        </div>
    );
}