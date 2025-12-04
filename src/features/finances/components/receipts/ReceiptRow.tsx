import { Eye, Monitor, Pencil, Smartphone, Tablet } from 'lucide-react';
import { FinanceReceipt } from '../../types';

interface ReceiptRowProps {
    receipt: FinanceReceipt;
    onView: (receipt: FinanceReceipt) => void;
    onEdit: (receipt: FinanceReceipt) => void;
}

export function ReceiptRow({ receipt, onView, onEdit }: ReceiptRowProps) {
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

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            paid: 'bg-green-100 text-green-700',
            cancelled: 'bg-red-100 text-red-700',
            partial: 'bg-yellow-100 text-yellow-700',
        };
        const labels: Record<string, string> = {
            paid: 'Оплачено',
            cancelled: 'Скасовано',
            partial: 'Часткова оплата',
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'web':
                return <Monitor size={16} className="text-muted-foreground" />;
            case 'mobile':
                return <Smartphone size={16} className="text-muted-foreground" />;
            case 'pos':
                return <Tablet size={16} className="text-muted-foreground" />;
            default:
                return null;
        }
    };

    return (
        <tr className="border-b border-border hover:bg-secondary/50 transition-colors">
            <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                {formatDate(receipt.date)}
            </td>
            <td className="px-4 py-3 text-sm text-primary font-medium hover:underline cursor-pointer" onClick={() => onView(receipt)}>
                {receipt.receiptNumber}
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {receipt.documentNumber}
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
                {receipt.cashRegister}
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
                {receipt.client}
            </td>
            <td className="px-4 py-3 text-sm text-foreground font-medium">
                ₴ {receipt.amount.toLocaleString()}
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
                {receipt.paymentMethod}
            </td>
            <td className="px-4 py-3">
                {getStatusBadge(receipt.status)}
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
                ₴ {receipt.balanceAfter.toLocaleString()}
            </td>
            <td className="px-4 py-3">
                {getSourceIcon(receipt.source)}
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                        onClick={() => onView(receipt)}
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        type="button"
                        className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                        onClick={() => onEdit(receipt)}
                    >
                        <Pencil size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
}