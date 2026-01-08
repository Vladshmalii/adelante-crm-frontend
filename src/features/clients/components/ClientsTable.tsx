import { ClientsTableHeader } from './ClientsTableHeader';
import { ClientsTableRow } from './ClientsTableRow';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Users } from 'lucide-react';
import type { Client } from '../types';

interface ClientsTableProps {
    clients: Client[];
    selectedClients: Set<string | number>;
    onToggleClient: (clientId: string | number) => void;
    onToggleAll: () => void;
    onClientClick: (client: Client) => void;
    onEditClient: (client: Client) => void;
    onDeleteClient: (client: Client) => void;
}

export function ClientsTable({
    clients,
    selectedClients,
    onToggleClient,
    onToggleAll,
    onClientClick,
    onEditClient,
    onDeleteClient,
}: ClientsTableProps) {
    const allSelected = clients.length > 0 && selectedClients.size === clients.length;

    if (clients.length === 0) {
        return (
            <EmptyState
                icon={<Users className="w-8 h-8" />}
                title="Немає клієнтів"
                description="У цьому сегменті ще немає клієнтів. Спробуйте змінити фільтри або додайте нового клієнта."
            />
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full">
                <ClientsTableHeader
                    allSelected={allSelected}
                    onToggleAll={onToggleAll}
                />
                <tbody>
                    {clients.map((client, index) => (
                        <ClientsTableRow
                            key={client.id}
                            client={client}
                            isSelected={selectedClients.has(client.id)}
                            onToggleSelect={() => onToggleClient(client.id)}
                            onClientClick={() => onClientClick(client)}
                            onEdit={() => onEditClient(client)}
                            onDelete={() => onDeleteClient(client)}
                            isEven={index % 2 === 0}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}