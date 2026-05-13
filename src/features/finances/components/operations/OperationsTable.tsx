import { FinanceOperation } from '../../types';
import { OperationRow } from './OperationRow';

interface OperationsTableProps {
    operations: FinanceOperation[];
    onView: (operation: FinanceOperation) => void;
    onEdit: (operation: FinanceOperation) => void;
}

export function OperationsTable({ operations, onView, onEdit }: OperationsTableProps) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card shadow-sm mx-4">
            <table className="w-full">
                <thead className="bg-secondary/20 border-b border-border/50">
                    <tr>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                            Дата і час
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                            № документа
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                            Каса
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                            Клієнт
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                            Сума
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                            Метод оплати
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                            Тип операції
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                            Статус
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                            Автор
                        </th>
                        <th className="px-4 py-4 text-right text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">
                            Дії
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                    {operations.map((operation) => (
                        <OperationRow
                            key={operation.id}
                            operation={operation}
                            onView={onView}
                            onEdit={onEdit}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}