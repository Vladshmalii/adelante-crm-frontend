import { Eye, Pencil } from 'lucide-react';
import { FinanceOperation } from '../../types';

interface OperationRowProps {
    operation: FinanceOperation;
    onView: (operation: FinanceOperation) => void;
    onEdit: (operation: FinanceOperation) => void;
}

export function OperationRow({ operation, onView, onEdit }: OperationRowProps) {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            payment: 'Платіж',
            refund: 'Повернення',
            transfer: 'Переказ',
            withdrawal: 'Видача',
            deposit: 'Внесення',
        };
        return types[type] || type;
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            completed: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        const labels: Record<string, string> = {
            completed: 'Завершено',
            pending: 'В обробці',
            cancelled: 'Скасовано',
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    return (
        <tr className="border-b border-border hover:bg-secondary/50 transition-colors">
            <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                {formatDate(operation.date)}
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
                {operation.documentNumber}
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
                {operation.cashRegister}
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
                {operation.client}
            </td>
            <td className="px-4 py-3 text-sm text-foreground font-medium">
                ₴ {operation.amount.toLocaleString()}
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
                {operation.paymentMethod}
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
                {getTypeLabel(operation.type)}
            </td>
            <td className="px-4 py-3">
                {getStatusBadge(operation.status)}
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {operation.author}
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                        onClick={() => onView(operation)}
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        type="button"
                        className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                        onClick={() => onEdit(operation)}
                    >
                        <Pencil size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
}