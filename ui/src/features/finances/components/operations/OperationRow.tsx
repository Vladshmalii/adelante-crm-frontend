import { Eye, Pencil } from 'lucide-react';
import { FinanceOperation } from '../../types';
import { Badge } from '@/shared/components/ui/Badge';
import clsx from 'clsx';

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
        const variants: Record<string, any> = {
            completed: { variant: 'success', label: 'Завершено' },
            pending: { variant: 'warning', label: 'В обробці' },
            cancelled: { variant: 'destructive', label: 'Скасовано' },
        };
        const config = variants[status] || { variant: 'default', label: status };
        return (
            <Badge
                variant={config.variant}
                className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
            >
                {config.label}
            </Badge>
        );
    };

    return (
        <tr className="border-b border-border/50 transition-all duration-300 hover:bg-primary/[0.02]">
            <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-foreground/80">
                {formatDate(operation.date)}
            </td>
            <td className="px-4 py-4 text-sm font-bold text-foreground">
                {operation.documentNumber}
            </td>
            <td className="px-4 py-4 text-sm text-foreground/80">{operation.cashRegister}</td>
            <td className="px-4 py-4">
                <span className="cursor-pointer text-sm font-bold text-foreground transition-colors hover:text-primary">
                    {operation.client}
                </span>
            </td>
            <td className="px-4 py-4 text-sm font-black text-foreground">
                ₴ {operation.amount.toLocaleString('uk-UA')}
            </td>
            <td className="px-4 py-4">
                <Badge
                    variant="secondary"
                    className="border-none bg-secondary text-[10px] font-bold uppercase text-foreground/70"
                >
                    {operation.paymentMethod}
                </Badge>
            </td>
            <td className="px-4 py-4 text-sm font-medium text-foreground/70">
                {getTypeLabel(operation.type)}
            </td>
            <td className="px-4 py-4">{getStatusBadge(operation.status)}</td>
            <td className="px-4 py-4 text-[11px] font-medium text-muted-foreground">
                {operation.author}
            </td>
            <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                        onClick={() => onView(operation)}
                    >
                        <Eye size={20} />
                    </button>
                    <button
                        type="button"
                        className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                        onClick={() => onEdit(operation)}
                    >
                        <Pencil size={20} />
                    </button>
                </div>
            </td>
        </tr>
    );
}
