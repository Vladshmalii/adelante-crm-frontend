'use client';

import { useState, useMemo } from 'react';
import { StaffHeader } from './StaffHeader';
import { StaffSegments } from './StaffSegments';
import { StaffFiltersBar } from './StaffFiltersBar';
import { StaffTable } from './StaffTable';
import { StaffPagination } from './StaffPagination';
import { AddStaffModal } from '../modals/AddStaffModal';
import { ImportExcelModal } from '@/features/clients/modals/ImportExcelModal';
import { ExportExcelModal } from '@/features/clients/modals/ExportExcelModal';
import { STAFF_MOCK } from '../data/mockStaff';
import { DEFAULT_ITEMS_PER_PAGE } from '../constants';
import type { StaffStatus, StaffFilters, Staff, AddStaffFormData } from '../types';
import type { ExportExcelOptions } from '@/features/clients/types';

export function StaffLayout() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeStatus, setActiveStatus] = useState<StaffStatus>('active');
    const [filters, setFilters] = useState<StaffFilters>({});
    const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

    const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
    const [isImportExcelModalOpen, setIsImportExcelModalOpen] = useState(false);
    const [isExportExcelModalOpen, setIsExportExcelModalOpen] = useState(false);

    const filteredStaff = useMemo(() => {
        let result = STAFF_MOCK.filter(
            (staff) => staff.status === activeStatus
        );

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (staff) =>
                    staff.name.toLowerCase().includes(query) ||
                    staff.phone.includes(query) ||
                    staff.email?.toLowerCase().includes(query)
            );
        }

        return result;
    }, [activeStatus, searchQuery]);

    const paginatedStaff = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredStaff.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredStaff, currentPage, itemsPerPage]);

    const handleToggleStaff = (staffId: string) => {
        const newSelected = new Set(selectedStaff);
        if (newSelected.has(staffId)) {
            newSelected.delete(staffId);
        } else {
            newSelected.add(staffId);
        }
        setSelectedStaff(newSelected);
    };

    const handleToggleAll = () => {
        if (selectedStaff.size === paginatedStaff.length) {
            setSelectedStaff(new Set());
        } else {
            setSelectedStaff(new Set(paginatedStaff.map((s) => s.id)));
        }
    };

    const handleStatusChange = (status: StaffStatus) => {
        setActiveStatus(status);
        setCurrentPage(1);
        setSelectedStaff(new Set());
    };

    const handleClearFilters = () => {
        setFilters({});
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setSelectedStaff(new Set());
    };

    const handleItemsPerPageChange = (items: number) => {
        setItemsPerPage(items);
        setCurrentPage(1);
        setSelectedStaff(new Set());
    };

    const handleStaffClick = (staff: Staff) => {
        console.log('Відкрити картку співробітника:', staff);
    };

    const handleSaveStaff = (data: AddStaffFormData) => {
        console.log('Зберегти співробітника:', data);
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
            <StaffHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddStaff={() => setIsAddStaffModalOpen(true)}
                onImportExcel={() => setIsImportExcelModalOpen(true)}
                onExportExcel={() => setIsExportExcelModalOpen(true)}
            />

            <StaffSegments
                activeStatus={activeStatus}
                onStatusChange={handleStatusChange}
            />

            <StaffFiltersBar
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={handleClearFilters}
            />

            <StaffTable
                staff={paginatedStaff}
                selectedStaff={selectedStaff}
                onToggleStaff={handleToggleStaff}
                onToggleAll={handleToggleAll}
                onStaffClick={handleStaffClick}
            />

            <StaffPagination
                pagination={{
                    currentPage,
                    itemsPerPage,
                    totalItems: filteredStaff.length,
                }}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
            />

            <AddStaffModal
                isOpen={isAddStaffModalOpen}
                onClose={() => setIsAddStaffModalOpen(false)}
                onSave={handleSaveStaff}
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
