import { Eye } from 'lucide-react';
import type { Record } from '../../types';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { RECORD_STATUSES, PAYMENT_STATUSES, RECORD_SOURCES } from '../../constants';
import clsx from 'clsx';

interface RecordRowProps {
    record: Record;
    isEven: boolean;
    onView: (record: Record) => void;
}

export function RecordRow({ record, isEven, onView }: RecordRowProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    };

    const getStatusLabel = (status: string) => {
        return RECORD_STATUSES.find(s => s.value === status)?.label || status;
    };

    const getPaymentLabel = (status: string) => {
        return PAYMENT_STATUSES.find(s => s.value === status)?.label || status;
    };

    const getSourceLabel = (source: string) => {
        return RECORD_SOURCES.find(s => s.value === source)?.label || source;
    };

    const getStatusVariant = (status: string): any => {
        switch (status) {
            case 'completed': return 'success';
            case 'confirmed': return 'primary';
            case 'pending': return 'warning';
            case 'cancelled': return 'destructive';
            default: return 'secondary';
        }
    };

    const getPaymentVariant = (status: string): any => {
        switch (status) {
            case 'paid': return 'success';
            case 'partial': return 'warning';
            case 'unpaid': return 'destructive';
            default: return 'secondary';
        }
    };

    return (
        <tr className="border-b border-border/50 transition-all duration-300 hover:bg-primary/[0.02]">
            <td className="px-4 py-4 text-[11px] font-medium text-muted-foreground/60 whitespace-nowrap">
                {formatDate(record.createdAt)}
            </td>
            <td className="px-4 py-4">
                <span className="text-sm font-bold text-foreground">
                    {record.employee}
                </span>
            </td>
            <td className="px-4 py-4">
                <span className="text-sm font-medium text-foreground/80">
                    {record.service}
                </span>
            </td>
            <td className="px-4 py-4">
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">
                        {record.client}
                    </span>
                    <span className="text-[11px] text-muted-foreground/60 font-medium">
                        {record.phone}
                    </span>
                </div>
            </td>
            <td className="px-4 py-4 text-sm font-medium text-foreground/80 whitespace-nowrap">
                {formatDate(record.visitTime)}
            </td>
            <td className="px-4 py-4 text-sm text-foreground/70">
                {record.createdBy}
            </td>
            <td className="px-4 py-4 text-sm font-black text-foreground">
                {record.amount ? `₴ ${record.amount.toLocaleString('uk-UA')}` : '—'}
            </td>
            <td className="px-4 py-4">
                <Badge variant={getStatusVariant(record.status)} className="font-bold">
                    {getStatusLabel(record.status)}
                </Badge>
            </td>
            <td className="px-4 py-4">
                <Badge variant={getPaymentVariant(record.paymentStatus)} className="font-bold">
                    {getPaymentLabel(record.paymentStatus)}
                </Badge>
            </td>
            <td className="px-4 py-4">
                <Badge variant="secondary" className="bg-secondary text-foreground/70 border-none font-bold text-[10px] uppercase">
                    {getSourceLabel(record.source)}
                </Badge>
            </td>
            <td className="px-4 py-4 text-right">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-[42px] w-[42px] p-0 rounded-xl bg-secondary/50 hover:bg-primary/10 hover:text-primary transition-all duration-300"
                    title="Показати деталі"
                    onClick={() => onView(record)}
                >
                    <Eye size={20} />
                </Button>
            </td>
        </tr>
    );
}