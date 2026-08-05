import { Eye, Monitor, Pencil, Smartphone, Tablet } from 'lucide-react';
import { FinanceReceipt } from '../../types';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';

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
        const variants: Record<string, 'success' | 'danger' | 'warning'> = {
            paid: 'success',
            cancelled: 'danger',
            partial: 'warning',
        };
        const labels: Record<string, string> = {
            paid: 'Оплачено',
            cancelled: 'Скасовано',
            partial: 'Часткова оплата',
        };
        return (
            <Badge
                variant={variants[status] || 'default'}
                className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
            >
                {labels[status]}
            </Badge>
        );
    };

    const getSourceIcon = (source: string) => {
        const iconClass =
            'text-muted-foreground/70 group-hover:text-primary transition-colors duration-300';
        switch (source) {
            case 'web':
                return <Monitor size={20} className={iconClass} />;
            case 'mobile':
                return <Smartphone size={20} className={iconClass} />;
            case 'pos':
                return <Tablet size={20} className={iconClass} />;
            default:
                return null;
        }
    };

    return (
        <tr className="border-b border-border/50 transition-all duration-300 hover:bg-primary/[0.02]">
            <td className="whitespace-nowrap px-4 py-4 text-[11px] font-medium text-muted-foreground/60">
                #{receipt.id}
            </td>
            <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-foreground/80">
                {formatDate(receipt.date)}
            </td>
            <td className="px-4 py-4">
                <span
                    className="cursor-pointer text-sm font-bold text-foreground transition-colors hover:text-primary"
                    onClick={() => onView(receipt)}
                >
                    {receipt.receiptNumber}
                </span>
            </td>
            <td className="px-4 py-4 text-sm font-medium text-muted-foreground/80">
                {receipt.documentNumber}
            </td>
            <td className="px-4 py-4 text-sm text-foreground/80">{receipt.cashRegister}</td>
            <td className="px-4 py-4">
                <span className="cursor-pointer text-sm font-bold text-foreground transition-colors hover:text-primary">
                    {receipt.client}
                </span>
            </td>
            <td className="px-4 py-4 text-sm font-black text-foreground">
                ₴ {receipt.amount.toLocaleString('uk-UA')}
            </td>
            <td className="px-4 py-4">
                <Badge
                    variant="secondary"
                    className="border-none bg-secondary text-[10px] font-bold uppercase text-foreground/70"
                >
                    {receipt.paymentMethod}
                </Badge>
            </td>
            <td className="px-4 py-4">{getStatusBadge(receipt.status)}</td>
            <td className="px-4 py-4 text-sm font-bold text-foreground/70">
                ₴ {receipt.balanceAfter.toLocaleString('uk-UA')}
            </td>
            <td className="px-4 py-4 text-sm font-medium text-foreground/70">
                {receipt.author || '—'}
            </td>
            <td className="px-4 py-4">
                <div className="flex items-center justify-center">
                    {getSourceIcon(receipt.source)}
                </div>
            </td>
            <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-[42px] w-[42px] rounded-xl bg-secondary/50 p-0 transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                        onClick={() => onView(receipt)}
                    >
                        <Eye size={20} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-[42px] w-[42px] rounded-xl bg-secondary/50 p-0 transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                        onClick={() => onEdit(receipt)}
                    >
                        <Pencil size={20} />
                    </Button>
                </div>
            </td>
        </tr>
    );
}
