import { Eye } from 'lucide-react';
import type { Change } from '../../types';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { CHANGE_ENTITIES, CHANGE_ACTIONS } from '../../constants';
import clsx from 'clsx';

interface ChangeRowProps {
    change: Change;
    isEven: boolean;
    onView: (change: Change) => void;
}

export function ChangeRow({ change, isEven, onView }: ChangeRowProps) {
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    };

    const getEntityLabel = (entity: string) => {
        return CHANGE_ENTITIES.find((e) => e.value === entity)?.label || entity;
    };

    const getActionLabel = (action: string) => {
        return CHANGE_ACTIONS.find((a) => a.value === action)?.label || action;
    };

    const getActionVariant = (action: string): any => {
        switch (action) {
            case 'created':
                return 'success';
            case 'updated':
                return 'primary';
            case 'deleted':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    return (
        <tr
            className={clsx(
                'border-b border-border/50 transition-all duration-300 hover:bg-primary/[0.02]',
                isEven ? 'bg-background' : 'bg-secondary/10',
            )}
        >
            <td className="px-4 py-4">
                <span className="text-sm font-medium text-foreground/70">
                    {formatDateTime(change.date)}
                </span>
            </td>
            <td className="px-4 py-4">
                <div className="text-sm font-bold text-foreground">{change.entityName}</div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {getEntityLabel(change.entity)}
                </div>
            </td>
            <td className="px-4 py-4">
                <span className="text-sm font-medium text-foreground">{change.author}</span>
            </td>
            <td className="px-4 py-4">
                <Badge variant={getActionVariant(change.action)} className="font-bold">
                    {getActionLabel(change.action)}
                </Badge>
            </td>
            <td className="px-4 py-4">
                <span
                    className="block max-w-[300px] truncate text-sm leading-relaxed text-foreground/60"
                    title={change.details}
                >
                    {change.details}
                </span>
            </td>
            <td className="px-4 py-4 text-right">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-[42px] w-[42px] rounded-xl bg-secondary/50 p-0 transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                    title="Показати деталі"
                    onClick={() => onView(change)}
                >
                    <Eye size={20} />
                </Button>
            </td>
        </tr>
    );
}
