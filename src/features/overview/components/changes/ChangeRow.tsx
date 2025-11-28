import { Eye } from 'lucide-react';
import type { Change } from '../../types';
import { CHANGE_ENTITIES, CHANGE_ACTIONS } from '../../constants';

interface ChangeRowProps {
    change: Change;
    isEven: boolean;
}

export function ChangeRow({ change, isEven }: ChangeRowProps) {
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
        return CHANGE_ENTITIES.find(e => e.value === entity)?.label || entity;
    };

    const getActionLabel = (action: string) => {
        return CHANGE_ACTIONS.find(a => a.value === action)?.label || action;
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'created': return 'text-green-600';
            case 'updated': return 'text-blue-600';
            case 'deleted': return 'text-red-600';
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
            <td className="px-4 py-3 text-sm text-foreground">{formatDateTime(change.date)}</td>
            <td className="px-4 py-3">
                <div className="text-sm font-medium text-primary">{change.entityName}</div>
                <div className="text-xs text-muted-foreground">{getEntityLabel(change.entity)}</div>
            </td>
            <td className="px-4 py-3 text-sm text-foreground">{change.author}</td>
            <td className="px-4 py-3">
        <span className={`text-sm font-medium ${getActionColor(change.action)}`}>
          {getActionLabel(change.action)}
        </span>
            </td>
            <td className="px-4 py-3">
                <button
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Показати деталі"
                    title={change.details}
                >
                    <Eye size={16} />
                </button>
            </td>
        </tr>
    );
}