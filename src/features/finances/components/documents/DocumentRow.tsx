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
            <Badge variant={variants[status] || 'default'} className="font-black uppercase text-[10px] px-2.5 py-1 tracking-wider">
                {labels[status]}
            </Badge>
        );
    };

    const servicesCount = 'servicesCount' in document ? document.servicesCount : undefined;
    const productsCount = 'productsCount' in document ? document.productsCount : undefined;
    const author = 'author' in document ? document.author : undefined;

    return (
        <tr className="border-b border-border/50 transition-all duration-300 hover:bg-primary/[0.02]">
            <td className="px-4 py-4 text-sm font-bold text-foreground">
                {document.number}
            </td>
            <td className="px-4 py-4 text-sm font-medium text-foreground/80">
                {formatDate(document.date)}
            </td>
            <td className="px-4 py-4">
                <Badge variant="secondary" className="bg-secondary text-foreground/70 border-none font-bold text-[10px] uppercase">
                    {getTypeLabel(document.type)}
                </Badge>
            </td>
            <td className="px-4 py-4 text-sm font-medium text-foreground/70">
                {getContentTypeLabel(document.contentType)}
            </td>
            <td className="px-4 py-4 text-sm font-black text-foreground">
                ₴ {document.amount.toLocaleString('uk-UA')}
            </td>
            <td className="px-4 py-4 text-sm font-bold text-muted-foreground/80 text-center">
                {servicesCount ?? '-'}
            </td>
            <td className="px-4 py-4 text-sm font-bold text-muted-foreground/80 text-center">
                {productsCount ?? '-'}
            </td>
            <td className="px-4 py-4 text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
                {document.counterparty}
            </td>
            <td className="px-4 py-4 text-[11px] text-muted-foreground/70 max-w-[200px] truncate italic">
                {document.comment || '-'}
            </td>
            <td className="px-4 py-4 text-sm font-medium text-muted-foreground/80">
                {author ?? '-'}
            </td>
            <td className="px-4 py-4">
                {getStatusBadge(document.status)}
            </td>
            <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-[42px] w-[42px] p-0 rounded-xl bg-secondary/50 hover:bg-primary/10 hover:text-primary transition-all duration-300"
                        onClick={() => onView(document)}
                    >
                        <Eye size={20} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-[42px] w-[42px] p-0 rounded-xl bg-secondary/50 hover:bg-primary/10 hover:text-primary transition-all duration-300"
                        onClick={() => onEdit(document)}
                    >
                        <Pencil size={20} />
                    </Button>
                </div>
            </td>
        </tr>
    );
}