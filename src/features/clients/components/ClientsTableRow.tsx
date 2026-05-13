import { ClientActionsMenu } from './ClientActionsMenu';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { ClientTag } from '../ui/ClientTag';
import { Badge } from '@/shared/components/ui/Badge';
import type { Client } from '../types';
import clsx from 'clsx';

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
    const formatDate = (dateString?: string) => {
        if (!dateString) return '—';
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
            className={clsx(
                'border-b border-border/50 transition-all duration-300 hover:bg-primary/[0.02]',
                isEven ? 'bg-background' : 'bg-secondary/20'
            )}
        >
            <td className="px-4 py-4">
                <Checkbox
                    checked={isSelected}
                    onChange={onToggleSelect}
                />
            </td>
            <td className="px-4 py-4">
                <button
                    onClick={onClientClick}
                    className="text-sm font-bold text-foreground hover:text-primary transition-colors text-left"
                >
                    {getPublicName(client.firstName, client.middleName)}
                </button>
            </td>
            <td className="px-4 py-4 hidden md:table-cell">
                <ClientTag segment={client.segment} />
            </td>
            <td className="px-4 py-4 text-sm font-medium text-foreground/80">{getMaskedPhone(client.phone)}</td>
            <td className="px-4 py-4 text-sm text-muted-foreground hidden xl:table-cell">
                {client.email ? '••••' : '—'}
            </td>
            <td className="px-4 py-4 text-sm font-black text-foreground hidden lg:table-cell">
                ₴ {client.totalSpent.toLocaleString('uk-UA')}
            </td>
            <td className="px-4 py-4 text-sm font-bold text-foreground hidden lg:table-cell text-center">{client.totalVisits}</td>
            <td className="px-4 py-4 text-sm font-bold text-primary hidden xl:table-cell text-center">
                <Badge variant="default" className="bg-primary/10 text-primary border-none">
                    {client.discount}%
                </Badge>
            </td>
            <td className="px-4 py-4 text-[11px] font-medium text-muted-foreground hidden lg:table-cell">
                {formatDate(client.lastVisit)}
            </td>
            <td className="px-4 py-4 text-[11px] font-medium text-muted-foreground hidden xl:table-cell">
                {formatDate(client.firstVisit)}
            </td>
            <td className="px-4 py-4 text-right">
                <ClientActionsMenu
                    onView={onClientClick}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </td>
        </tr>
    );
}