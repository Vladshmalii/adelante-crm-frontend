import { FinanceOperation } from '../../types';
import { OperationRow } from './OperationRow';

interface OperationsTableProps {
    operations: FinanceOperation[];
    onView: (operation: FinanceOperation) => void;
    onEdit: (operation: FinanceOperation) => void;
}

export function OperationsTable({ operations, onView, onEdit }: OperationsTableProps) {
    return (
        <div className="mx-4 overflow-x-auto rounded-2xl border border-border/50 bg-card shadow-sm">
            <table className="w-full">
                <thead className="border-b border-border/50 bg-secondary/20">
                    <tr>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Дата і час
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            № документа
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Каса
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Клієнт
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Сума
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Метод оплати
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Тип операції
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Статус
                        </th>
                        <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
                            Автор
                        </th>
                        <th className="px-4 py-4 text-right text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">
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
