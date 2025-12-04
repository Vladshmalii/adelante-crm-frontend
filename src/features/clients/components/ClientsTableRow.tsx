import { ClientActionsMenu } from './ClientActionsMenu';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { ClientTag } from '../ui/ClientTag';
import type { Client } from '../types';

interface ClientsTableRowProps {
    client: Client;
    isSelected: boolean;
    onToggleSelect: () => void;
    onClientClick: () => void;
    onEdit: () => void;
    onDelete: () => void;
    isEven: boolean;
}

export function ClientsTableRow({
    client,
    isSelected,
    onToggleSelect,
    onClientClick,
    onEdit,
    onDelete,
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

    const getMaskedPhone = (phone?: string) => {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        if (digits.length <= 4) return digits;
        const last4 = digits.slice(-4);
        return `•••• ${last4}`;
    };

    const getPublicName = (firstName: string, middleName?: string) => {
        if (middleName) {
            return `${firstName} ${middleName}`;
        }
        return firstName;
    };

    return (
        <tr
            className={`
        border-b border-border transition-colors hover:bg-secondary/50
        ${isEven ? 'bg-background' : 'bg-secondary/30'}
      `}
        >
            <td className="px-4 py-3">
                <Checkbox
                    checked={isSelected}
                    onChange={onToggleSelect}
                />
            </td>
            <td className="px-4 py-3">
                <button
                    onClick={onClientClick}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                    {getPublicName(client.firstName, client.middleName)}
                </button>
            </td>
            <td className="px-4 py-3">
                <ClientTag segment={client.segment} />
            </td>
            <td className="px-4 py-3 text-sm text-foreground">{getMaskedPhone(client.phone)}</td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {client.email ? 'Приховано' : '—'}
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
                <ClientActionsMenu
                    onView={onClientClick}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </td>
        </tr>
    );
}