import { MoreVertical } from 'lucide-react';
import type { Client } from '../types';

interface ClientsTableRowProps {
    client: Client;
    isSelected: boolean;
    onToggleSelect: () => void;
    onClientClick: () => void;
    isEven: boolean;
}

export function ClientsTableRow({
    client,
    isSelected,
    onToggleSelect,
    onClientClick,
    isEven,
}: ClientsTableRowProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    };

    return (
        <tr
            className={`
        border-b border-border transition-colors hover:bg-secondary/50
        ${isEven ? 'bg-background' : 'bg-secondary/30'}
      `}
        >
            <td className="px-4 py-3">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggleSelect}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-ring cursor-pointer"
                />
            </td>
            <td className="px-4 py-3">
                <button
                    onClick={onClientClick}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                    {client.name}
                </button>
            </td>
            <td className="px-4 py-3 text-sm text-foreground">{client.phone}</td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {client.email || '—'}
            </td>
            <td className="px-4 py-3 text-sm font-medium text-foreground">
                {client.totalSpent.toLocaleString('uk-UA')} ₴
            </td>
            <td className="px-4 py-3 text-sm text-foreground">{client.visits}</td>
            <td className="px-4 py-3 text-sm text-foreground">{client.discount}%</td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {formatDate(client.lastVisit)}
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {formatDate(client.firstVisit)}
            </td>
            <td className="px-4 py-3">
                <button
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Дії"
                >
                    <MoreVertical size={18} />
                </button>
            </td>
        </tr>
    );
}