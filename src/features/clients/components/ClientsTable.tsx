import { ClientsTableHeader } from './ClientsTableHeader';
import { ClientsTableRow } from './ClientsTableRow';
import type { Client } from '../types';

interface ClientsTableProps {
    clients: Client[];
    selectedClients: Set<string>;
    onToggleClient: (clientId: string) => void;
    onToggleAll: () => void;
    onClientClick: (client: Client) => void;
}

export function ClientsTable({
                                 clients,
                                 selectedClients,
                                 onToggleClient,
                                 onToggleAll,
                                 onClientClick,
                             }: ClientsTableProps) {
    const allSelected = clients.length > 0 && selectedClients.size === clients.length;

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
                        isEven={index % 2 === 0}
                    />
                ))}
                </tbody>
            </table>
        </div>
    );
}