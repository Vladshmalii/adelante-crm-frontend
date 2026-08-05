import { Eye, Pencil } from 'lucide-react';
import { FinanceDocument } from '../../types';
import type { FinanceDocument as ApiFinanceDocument } from '@/lib/api/finances';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';

type DocumentLike = FinanceDocument | ApiFinanceDocument;

interface DocumentRowProps {
    document: DocumentLike;
    onView: (document: DocumentLike) => void;
    onEdit: (document: DocumentLike) => void;
}

export function DocumentRow({ document, onView, onEdit }: DocumentRowProps) {
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
        const variants: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
            draft: 'default',
            completed: 'success',
            cancelled: 'danger',
        };
        const labels: Record<string, string> = {
            draft: 'Чернетка',
            completed: 'Завершено',
            cancelled: 'Скасовано',
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

    const servicesCount = 'servicesCount' in document ? document.servicesCount : undefined;
    const productsCount = 'productsCount' in document ? document.productsCount : undefined;
    const author = 'author' in document ? document.author : undefined;

    return (
        <tr className="border-b border-border/50 transition-all duration-300 hover:bg-primary/[0.02]">
            <td className="px-4 py-4 text-sm font-bold text-foreground">{document.number}</td>
            <td className="px-4 py-4 text-sm font-medium text-foreground/80">
                {formatDate(document.date)}
            </td>
            <td className="px-4 py-4">
                <Badge
                    variant="secondary"
                    className="border-none bg-secondary text-[10px] font-bold uppercase text-foreground/70"
                >
                    {getTypeLabel(document.type)}
                </Badge>
            </td>
            <td className="px-4 py-4 text-sm font-medium text-foreground/70">
                {getContentTypeLabel(document.contentType)}
            </td>
            <td className="px-4 py-4 text-sm font-black text-foreground">
                ₴ {document.amount.toLocaleString('uk-UA')}
            </td>
            <td className="px-4 py-4 text-center text-sm font-bold text-muted-foreground/80">
                {servicesCount ?? '-'}
            </td>
            <td className="px-4 py-4 text-center text-sm font-bold text-muted-foreground/80">
                {productsCount ?? '-'}
            </td>
            <td className="cursor-pointer px-4 py-4 text-sm font-bold text-foreground transition-colors hover:text-primary">
                {document.counterparty}
            </td>
            <td className="max-w-[200px] truncate px-4 py-4 text-[11px] italic text-muted-foreground/70">
                {document.comment || '-'}
            </td>
            <td className="px-4 py-4 text-sm font-medium text-muted-foreground/80">
                {author ?? '-'}
            </td>
            <td className="px-4 py-4">{getStatusBadge(document.status)}</td>
            <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-[42px] w-[42px] rounded-xl bg-secondary/50 p-0 transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                        onClick={() => onView(document)}
                    >
                        <Eye size={20} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-[42px] w-[42px] rounded-xl bg-secondary/50 p-0 transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                        onClick={() => onEdit(document)}
                    >
                        <Pencil size={20} />
                    </Button>
                </div>
            </td>
        </tr>
    );
}
