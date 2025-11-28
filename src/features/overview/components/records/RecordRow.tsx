import { Edit2 } from 'lucide-react';
import type { Record } from '../../types';
import { RECORD_STATUSES, PAYMENT_STATUSES, RECORD_SOURCES } from '../../constants';

interface RecordRowProps {
    record: Record;
    isEven: boolean;
}

export function RecordRow({ record, isEven }: RecordRowProps) {
    const formatDateTime = (dateString: string) => {
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600';
            case 'confirmed': return 'text-blue-600';
            case 'pending': return 'text-yellow-600';
            case 'cancelled': return 'text-red-600';
            default: return 'text-muted-foreground';
        }
    };

    const getPaymentColor = (status: string) => {
        switch (status) {
            case 'paid': return 'text-green-600';
            case 'partial': return 'text-yellow-600';
            case 'unpaid': return 'text-red-600';
            default: return 'text-muted-foreground';
        }
    };

    return (
        <tr
            className={`
        border-b border-border transition-colors hover:bg-secondary/50
        ${isEven ? 'bg-background' : 'bg-secondary/30'}
      `}
        >
            <td className="px-4 py-3 text-sm text-foreground">{record.employee}</td>
            <td className="px-4 py-3 text-sm text-foreground">{record.service}</td>
            <td className="px-4 py-3">
                <div className="text-sm font-medium text-primary">{record.client}</div>
                <div className="text-xs text-muted-foreground">{record.phone}</div>
            </td>
            <td className="px-4 py-3 text-sm text-foreground">{formatDateTime(record.visitTime)}</td>
            <td className="px-4 py-3 text-sm text-muted-foreground">{record.createdBy}</td>
            <td className="px-4 py-3">
        <span className={`text-sm font-medium ${getStatusColor(record.status)}`}>
          {getStatusLabel(record.status)}
        </span>
            </td>
            <td className="px-4 py-3">
        <span className={`text-sm font-medium ${getPaymentColor(record.paymentStatus)}`}>
          {getPaymentLabel(record.paymentStatus)}
        </span>
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground">{getSourceLabel(record.source)}</td>
            <td className="px-4 py-3">
                <button
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Редагувати"
                >
                    <Edit2 size={16} />
                </button>
            </td>
        </tr>
    );
}