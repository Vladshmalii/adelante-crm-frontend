import { useState, useMemo } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { ClientsHeader } from './ClientsHeader';
import { ClientsSegments } from './ClientsSegments';
import { ClientsFiltersBar } from './ClientsFiltersBar';
import { ClientsTable } from './ClientsTable';
import { ClientsPagination } from './ClientsPagination';
import { AddClientModal } from '../modals/AddClientModal';
import { EditClientModal } from '../modals/EditClientModal';
import { ClientDetailsModal } from '../modals/ClientDetailsModal';
import { ImportExcelModal } from '../modals/ImportExcelModal';
import { ExportExcelModal } from '../modals/ExportExcelModal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { Loader } from '@/shared/components/ui/Loader';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { CLIENTS_MOCK } from '../data/mockClients';
import { DEFAULT_ITEMS_PER_PAGE } from '../constants';
import type { ClientSegment, ClientFilters, Client, AddClientFormData, ExportExcelOptions } from '../types';

export function ClientsLayout() {
    const toast = useToast();
    // ⚠️ ДЕМОНСТРАЦИЯ LOADER: Установите isLoading = false, чтобы скрыть loader
    // Место для отключения loader: строка 20
    const [isLoading, setIsLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeSegment, setActiveSegment] = useState<ClientSegment>('repeat');
    const [filters, setFilters] = useState<ClientFilters>({});
    const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
    const [isClientDetailsModalOpen, setIsClientDetailsModalOpen] = useState(false);
    const [isDeleteClientModalOpen, setIsDeleteClientModalOpen] = useState(false);
    const [isImportExcelModalOpen, setIsImportExcelModalOpen] = useState(false);
    const [isExportExcelModalOpen, setIsExportExcelModalOpen] = useState(false);

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const filteredClients = useMemo(() => {
        let result = CLIENTS_MOCK.filter(
            (client) => client.segment === activeSegment
        );

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (client) =>
                    `${client.firstName} ${client.middleName || ''} ${client.lastName || ''}`.toLowerCase().includes(query) ||
                    client.phone.includes(query) ||
                    client.email?.toLowerCase().includes(query)
            );
        }

        return result;
    }, [activeSegment, searchQuery]);

    const paginatedClients = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredClients.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredClients, currentPage, itemsPerPage]);

    const handleToggleClient = (clientId: string) => {
        const newSelected = new Set(selectedClients);
        if (newSelected.has(clientId)) {
            newSelected.delete(clientId);
        } else {
            newSelected.add(clientId);
        }
        setSelectedClients(newSelected);
    };

    const handleToggleAll = () => {
        if (selectedClients.size === paginatedClients.length) {
            setSelectedClients(new Set());
        } else {
            setSelectedClients(new Set(paginatedClients.map((c) => c.id)));
        }
    };

    const handleSegmentChange = (segment: ClientSegment) => {
        setActiveSegment(segment);
        setCurrentPage(1);
        setSelectedClients(new Set());
    };

    const handleClearFilters = () => {
        setFilters({});
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setSelectedClients(new Set());
    };

    const handleItemsPerPageChange = (items: number) => {
        setItemsPerPage(items);
        setCurrentPage(1);
        setSelectedClients(new Set());
    };

    const handleClientClick = (client: Client) => {
        setSelectedClient(client);
        setIsClientDetailsModalOpen(true);
    };

    const handleEditClient = (client: Client) => {
        setSelectedClient(client);
        setIsEditClientModalOpen(true);
    };

    const handleDeleteClient = (client: Client) => {
        setSelectedClient(client);
        setIsDeleteClientModalOpen(true);
    };

    const handleSaveClient = (data: AddClientFormData) => {
        console.log('Зберегти клієнта:', data);
    };

    const handleUpdateClient = (id: string, data: AddClientFormData) => {
        console.log('Оновити клієнта:', id, data);
    };

    const handleConfirmDelete = () => {
        if (selectedClient) {
            console.log('Видалити клієнта:', selectedClient.id);
            toast.success('Клієнта видалено', 'Успіх');
            setIsDeleteClientModalOpen(false);
            setSelectedClient(null);
            setIsClientDetailsModalOpen(false);
        }
    };

    const handleImportExcel = (file: File) => {
        console.log('Імпорт Excel файлу:', file.name);
    };

    const handleExportExcel = (options: ExportExcelOptions) => {
        console.log('Експорт в Excel з опціями:', options);
    };

    return (
        <div className="p-6">
            <ClientsHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddClient={() => setIsAddClientModalOpen(true)}
                onImportExcel={() => setIsImportExcelModalOpen(true)}
                onExportExcel={() => setIsExportExcelModalOpen(true)}
            />

            <ClientsSegments
                activeSegment={activeSegment}
                onSegmentChange={handleSegmentChange}
            />

            <ClientsFiltersBar
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={handleClearFilters}
            />

            {isLoading ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-10 gap-4 p-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Skeleton key={index} variant="rectangle" height="60px" />
                        ))}
                    </div>
                    <div className="flex justify-center">
                        <Skeleton variant="rectangle" width="300px" height="40px" />
                    </div>
                </div>
            ) : (
                <>
                    <ClientsTable
                        clients={paginatedClients}
                        selectedClients={selectedClients}
                        onToggleClient={handleToggleClient}
                        onToggleAll={handleToggleAll}
                        onClientClick={handleClientClick}
                        onEditClient={handleEditClient}
                        onDeleteClient={handleDeleteClient}
                    />

                    <ClientsPagination
                        pagination={{
                            currentPage,
                            itemsPerPage,
                            totalItems: filteredClients.length,
                        }}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleItemsPerPageChange}
                    />
                </>
            )}

            <AddClientModal
                isOpen={isAddClientModalOpen}
                onClose={() => setIsAddClientModalOpen(false)}
                onSave={handleSaveClient}
            />

            <EditClientModal
                isOpen={isEditClientModalOpen}
                onClose={() => setIsEditClientModalOpen(false)}
                onSave={handleUpdateClient}
                client={selectedClient}
            />

            <ClientDetailsModal
                isOpen={isClientDetailsModalOpen}
                onClose={() => setIsClientDetailsModalOpen(false)}
                onEdit={() => {
                    setIsClientDetailsModalOpen(false);
                    setIsEditClientModalOpen(true);
                }}
                onDelete={() => {
                    setIsClientDetailsModalOpen(false);
                    setIsDeleteClientModalOpen(true);
                }}
                client={selectedClient}
            />

            <ConfirmDialog
                isOpen={isDeleteClientModalOpen}
                onClose={() => setIsDeleteClientModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Видалити клієнта?"
                message={`Ви впевнені, що хочете видалити клієнта "${selectedClient?.firstName} ${selectedClient?.middleName || ''} ${selectedClient?.lastName || ''}"? Цю дію неможливо скасувати.`}
                confirmText="Видалити"
                cancelText="Скасувати"
                variant="danger"
            />

            <ImportExcelModal
                isOpen={isImportExcelModalOpen}
                onClose={() => setIsImportExcelModalOpen(false)}
                onImport={handleImportExcel}
            />

            <ExportExcelModal
                isOpen={isExportExcelModalOpen}
                onClose={() => setIsExportExcelModalOpen(false)}
                onExport={handleExportExcel}
            />
        </div>
    );
}