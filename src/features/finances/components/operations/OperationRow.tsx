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
                className="font-black uppercase text-[10px] tracking-wider px-2 py-0.5"
            >
                {config.label}
            </Badge>
        );
    };

    return (
        <tr className="border-b border-border/50 transition-all duration-300 hover:bg-primary/[0.02]">
            <td className="px-4 py-4 text-sm font-medium text-foreground/80 whitespace-nowrap">
                {formatDate(operation.date)}
            </td>
            <td className="px-4 py-4 text-sm font-bold text-foreground">
                {operation.documentNumber}
            </td>
            <td className="px-4 py-4 text-sm text-foreground/80">
                {operation.cashRegister}
            </td>
            <td className="px-4 py-4">
                <span className="text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
                    {operation.client}
                </span>
            </td>
            <td className="px-4 py-4 text-sm font-black text-foreground">
                ₴ {operation.amount.toLocaleString('uk-UA')}
            </td>
            <td className="px-4 py-4">
                <Badge variant="secondary" className="bg-secondary text-foreground/70 border-none font-bold text-[10px] uppercase">
                    {operation.paymentMethod}
                </Badge>
            </td>
            <td className="px-4 py-4 text-sm font-medium text-foreground/70">
                {getTypeLabel(operation.type)}
            </td>
            <td className="px-4 py-4">
                {getStatusBadge(operation.status)}
            </td>
            <td className="px-4 py-4 text-[11px] font-medium text-muted-foreground">
                {operation.author}
            </td>
            <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        className="h-[42px] w-[42px] flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 rounded-xl bg-secondary/50 hover:bg-primary/10"
                        onClick={() => onView(operation)}
                    >
                        <Eye size={20} />
                    </button>
                    <button
                        type="button"
                        className="h-[42px] w-[42px] flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 rounded-xl bg-secondary/50 hover:bg-primary/10"
                        onClick={() => onEdit(operation)}
                    >
                        <Pencil size={20} />
                    </button>
                </div>
            </td>
        </tr>
    );
}