import { FinanceOperation } from '../../types';
import { OperationRow } from './OperationRow';

interface OperationsTableProps {
    operations: FinanceOperation[];
    onView: (operation: FinanceOperation) => void;
    onEdit: (operation: FinanceOperation) => void;
}

export function OperationsTable({ operations, onView, onEdit }: OperationsTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-secondary/50">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Дата і час
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        № документа
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Каса
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Клієнт
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Сума
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Метод оплати
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Тип операції
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Статус
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Автор
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Дії
                    </th>
                </tr>
                </thead>
                <tbody>
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