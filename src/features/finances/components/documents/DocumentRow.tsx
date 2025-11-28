import { Eye } from 'lucide-react';
import { FinanceDocument } from '../../types';

interface DocumentRowProps {
    document: FinanceDocument;
}

export function DocumentRow({ document }: DocumentRowProps) {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const getTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            receipt: 'Чек',
            invoice: 'Рахунок',
            expense: 'Видаток',
            income: 'Прихід',
            act: 'Акт',
        };
        return types[type] || type;
    };

    const getContentTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            services: 'Послуги',
            products: 'Товари',
            mixed: 'Змішане',
        };
        return types[type] || type;
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-700',
            completed: 'bg-green-100 text-green-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        const labels: Record<string, string> = {
            draft: 'Чернетка',
            completed: 'Завершено',
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
            <td className="px-4 py-3 text-sm text-foreground">
                {document.number}
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
                {formatDate(document.date)}
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
                {getTypeLabel(document.type)}
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
                {getContentTypeLabel(document.contentType)}
            </td>
            <td className="px-4 py-3 text-sm text-foreground font-medium">
                ₴ {document.amount.toLocaleString()}
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground text-center">
                {document.servicesCount}
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground text-center">
                {document.productsCount}
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
                {document.counterparty}
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                {document.comment}
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {document.author}
            </td>
            <td className="px-4 py-3">
                {getStatusBadge(document.status)}
            </td>
            <td className="px-4 py-3">
                <button className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors">
                    <Eye size={16} />
                </button>
            </td>
        </tr>
    );
}