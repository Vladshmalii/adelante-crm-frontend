import { useState, useEffect } from 'react';
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
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { GlobalLoader } from '@/shared/components/ui/GlobalLoader';
import { DEFAULT_ITEMS_PER_PAGE } from '../constants';
import type {
    ClientSegment,
    ClientFilters,
    Client,
    AddClientFormData,
    ExportExcelOptions,
} from '../types';
import { useClients } from '../hooks/useClients';
import { clientsApi, type ClientWritePayload } from '@/lib/api/clients';
import { USE_MOCK_DATA } from '@/lib/config';

export function ClientsLayout() {
    const toast = useToast();
    const [isLoadingLocal, setIsLoadingLocal] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeSegment, setActiveSegment] = useState<ClientSegment>('repeat');
    const [filters, setFilters] = useState<ClientFilters>({});
    const [selectedClients, setSelectedClients] = useState<Set<string | number>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
    const [isClientDetailsModalOpen, setIsClientDetailsModalOpen] = useState(false);
    const [isDeleteClientModalOpen, setIsDeleteClientModalOpen] = useState(false);
    const [isImportExcelModalOpen, setIsImportExcelModalOpen] = useState(false);
    const [isExportExcelModalOpen, setIsExportExcelModalOpen] = useState(false);

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const { clients, pagination, isLoading, error, createClient, updateClient, deleteClient } =
        useClients({
            search: searchQuery,
            segment: activeSegment,
            page: currentPage,
            limit: itemsPerPage,
        });

    useEffect(() => {
        if (error) {
            toast.error('Помилка', error);
        }
    }, [error, toast]);

    // Фільтрація і пагінація виконуються на бекенді (useClients передає
    // search/segment/page як query-параметри) — тут рендеримо результат як є.
    const paginatedClients = clients;

    const handleToggleClient = (clientId: string | number) => {
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

    const buildBirthDate = (data: AddClientFormData) => {
        if (data.birthYear && data.birthMonth && data.birthDay) {
            return `${data.birthYear}-${data.birthMonth}-${data.birthDay}`;
        }
        return undefined;
    };

    const buildPayload = (data: AddClientFormData): ClientWritePayload => ({
        firstName: data.firstName,
        lastName: data.lastName || undefined,
        middleName: data.middleName,
        phone: data.phone,
        additionalPhone: data.additionalPhone,
        email: data.email,
        cardNumber: data.cardNumber,
        birthDate: buildBirthDate(data),
        gender: data.gender,
        color: data.colorLabel,
        category: data.category,
        importance: data.importance,
        discount: data.discount,
        noOnlineBooking: data.noOnlineBooking,
    });

    const handleSaveClient = async (data: AddClientFormData) => {
        setIsLoadingLocal(true);
        try {
            await createClient(buildPayload(data));
            toast.success('Клієнта створено', 'Успіх');
            setIsAddClientModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error(
                'Помилка',
                err instanceof Error ? err.message : 'Не вдалося створити клієнта',
            );
        } finally {
            setIsLoadingLocal(false);
        }
    };

    const handleUpdateClient = async (id: string | number, data: AddClientFormData) => {
        if (!selectedClient) return;
        setIsLoadingLocal(true);
        try {
            await updateClient(id, buildPayload(data));
            toast.success('Клієнта оновлено', 'Успіх');
            setIsEditClientModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error(
                'Помилка',
                err instanceof Error ? err.message : 'Не вдалося оновити клієнта',
            );
        } finally {
            setIsLoadingLocal(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedClient) return;
        setIsLoadingLocal(true);
        try {
            await deleteClient(selectedClient.id);
            toast.success('Клієнта видалено', 'Успіх');
            setIsDeleteClientModalOpen(false);
            setSelectedClient(null);
            setIsClientDetailsModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error(
                'Помилка',
                err instanceof Error ? err.message : 'Не вдалося видалити клієнта',
            );
        } finally {
            setIsLoadingLocal(false);
        }
    };

    const handleImportExcel = async (file: File) => {
        try {
            setIsLoadingLocal(true);
            if (!USE_MOCK_DATA) {
                await clientsApi.import(file);
                toast.success('Імпортовано', 'Дані клієнтів оновлено');
            } else {
                toast.info('Демо режим', 'Імпорт не виконується в демо режимі');
            }
        } catch (err) {
            console.error(err);
            toast.error(
                'Помилка імпорту',
                err instanceof Error ? err.message : 'Не вдалося імпортувати файл',
            );
        } finally {
            setIsLoadingLocal(false);
            setIsImportExcelModalOpen(false);
        }
    };

    const handleExportExcel = async (options: ExportExcelOptions) => {
        try {
            setIsLoadingLocal(true);
            if (!USE_MOCK_DATA) {
                const blob = await clientsApi.export({ includeVisits: options.includeVisits });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'clients.xlsx';
                link.click();
                window.URL.revokeObjectURL(url);
                toast.success('Експорт виконано', 'Файл завантажено');
            } else {
                toast.info('Демо режим', 'Експорт не виконується в демо режимі');
            }
        } catch (err) {
            console.error(err);
            toast.error(
                'Помилка експорту',
                err instanceof Error ? err.message : 'Не вдалося експортувати',
            );
        } finally {
            setIsLoadingLocal(false);
            setIsExportExcelModalOpen(false);
        }
    };

    return (
        <div className="p-6">
            <GlobalLoader isLoading={isLoading} />
            <GlobalLoader isLoading={isLoadingLocal} />

            <ClientsHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddClient={() => setIsAddClientModalOpen(true)}
                onImportExcel={() => setIsImportExcelModalOpen(true)}
                onExportExcel={() => setIsExportExcelModalOpen(true)}
            />

            <ClientsSegments activeSegment={activeSegment} onSegmentChange={handleSegmentChange} />

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
                            totalItems: pagination.total,
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
