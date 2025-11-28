import { useState, useMemo } from 'react';
import { ClientsHeader } from './ClientsHeader';
import { ClientsSegments } from './ClientsSegments';
import { ClientsFiltersBar } from './ClientsFiltersBar';
import { ClientsTable } from './ClientsTable';
import { ClientsPagination } from './ClientsPagination';
import { AddClientModal } from '../modals/AddClientModal';
import { ImportExcelModal } from '../modals/ImportExcelModal';
import { ExportExcelModal } from '../modals/ExportExcelModal';
import { CLIENTS_MOCK } from '../data/mockClients';
import { DEFAULT_ITEMS_PER_PAGE } from '../constants';
import type { ClientSegment, ClientFilters, Client, AddClientFormData, ExportExcelOptions } from '../types';

export function ClientsLayout() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSegment, setActiveSegment] = useState<ClientSegment>('repeat');
    const [filters, setFilters] = useState<ClientFilters>({});
    const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

    // Modals state
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [isImportExcelModalOpen, setIsImportExcelModalOpen] = useState(false);
    const [isExportExcelModalOpen, setIsExportExcelModalOpen] = useState(false);

    const filteredClients = useMemo(() => {
        let result = CLIENTS_MOCK.filter(
            (client) => client.segment === activeSegment
        );

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (client) =>
                    client.name.toLowerCase().includes(query) ||
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
        console.log('Відкрити картку клієнта:', client);
    };

    const handleSaveClient = (data: AddClientFormData) => {
        console.log('Зберегти клієнта:', data);
        // TODO: Implement actual save logic
    };

    const handleImportExcel = (file: File) => {
        console.log('Імпорт Excel файлу:', file.name);
        // TODO: Implement actual import logic
    };

    const handleExportExcel = (options: ExportExcelOptions) => {
        console.log('Експорт в Excel з опціями:', options);
        // TODO: Implement actual export logic
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

            <ClientsTable
                clients={paginatedClients}
                selectedClients={selectedClients}
                onToggleClient={handleToggleClient}
                onToggleAll={handleToggleAll}
                onClientClick={handleClientClick}
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

            <AddClientModal
                isOpen={isAddClientModalOpen}
                onClose={() => setIsAddClientModalOpen(false)}
                onSave={handleSaveClient}
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