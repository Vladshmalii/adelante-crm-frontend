import { FinanceReceipt } from '../../types';
import { ReceiptRow } from './ReceiptRow';

interface ReceiptsTableProps {
    receipts: FinanceReceipt[];
    onView: (receipt: FinanceReceipt) => void;
    onEdit: (receipt: FinanceReceipt) => void;
}

export function ReceiptsTable({ receipts, onView, onEdit }: ReceiptsTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-secondary/50">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Дата і час
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Чек
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
                        Статус
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Залишок у касі
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Джерело
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Дії
                    </th>
                </tr>
                </thead>
                <tbody>
                {receipts.map((receipt) => (
                    <ReceiptRow
                        key={receipt.id}
                        receipt={receipt}
                        onView={onView}
                        onEdit={onEdit}
                    />
                ))}
                </tbody>
            </table>
        </div>
    );
}