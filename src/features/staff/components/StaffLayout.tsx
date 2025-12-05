'use client';

import { useState, useMemo } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { StaffHeader } from './StaffHeader';
import { StaffSegments } from './StaffSegments';
import { StaffFiltersBar } from './StaffFiltersBar';
import { StaffStats } from './StaffStats';
import { StaffTable } from './StaffTable';
import { StaffPagination } from './StaffPagination';
import { AddStaffModal } from '../modals/AddStaffModal';
import { EditStaffModal } from '../modals/EditStaffModal';
import { StaffDetailsModal } from '../modals/StaffDetailsModal';
import { StaffScheduleModal } from '../modals/StaffScheduleModal';
import { StaffStatisticsModal } from '../modals/StaffStatisticsModal';
import { ImportExcelModal } from '@/features/clients/modals/ImportExcelModal';
import { ExportExcelModal } from '@/features/clients/modals/ExportExcelModal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { STAFF_MOCK } from '../data/mockStaff';
import { DEFAULT_ITEMS_PER_PAGE } from '../constants';
import type { StaffStatus, StaffFilters, Staff, AddStaffFormData } from '../types';
import type { ExportExcelOptions } from '@/features/clients/types';

export function StaffLayout() {
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeStatus, setActiveStatus] = useState<StaffStatus>('active');
    const [filters, setFilters] = useState<StaffFilters>({});
    const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

    const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
    const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false);
    const [isStaffDetailsModalOpen, setIsStaffDetailsModalOpen] = useState(false);
    const [isDeleteStaffModalOpen, setIsDeleteStaffModalOpen] = useState(false);
    const [isImportExcelModalOpen, setIsImportExcelModalOpen] = useState(false);
    const [isExportExcelModalOpen, setIsExportExcelModalOpen] = useState(false);

    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

    const [selectedStaffMember, setSelectedStaffMember] = useState<Staff | null>(null);

    const filteredStaff = useMemo(() => {
        let result = STAFF_MOCK.filter(
            (staff) => staff.status === activeStatus
        );

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (staff) =>
                    `${staff.firstName} ${staff.middleName || ''} ${staff.lastName || ''}`.toLowerCase().includes(query) ||
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
        setSelectedStaffMember(staff);
        setIsStaffDetailsModalOpen(true);
    };

    const handleEditStaff = (staff: Staff) => {
        setSelectedStaffMember(staff);
        setIsEditStaffModalOpen(true);
    };

    const handleDeleteStaff = (staff: Staff) => {
        setSelectedStaffMember(staff);
        setIsDeleteStaffModalOpen(true);
    };

    const handleScheduleStaff = (staff: Staff) => {
        setSelectedStaffMember(staff);
        setIsScheduleModalOpen(true);
    };

    const handleStatisticsStaff = (staff: Staff) => {
        setSelectedStaffMember(staff);
        setIsStatsModalOpen(true);
    };

    const handleSaveStaff = (data: AddStaffFormData) => {
        console.log('Зберегти співробітника:', data);
    };

    const handleUpdateStaff = (id: string, data: AddStaffFormData) => {
        console.log('Оновити співробітника:', id, data);
    };

    const handleConfirmDelete = () => {
        if (selectedStaffMember) {
            console.log('Видалити співробітника:', selectedStaffMember.id);
            toast.success('Співробітника видалено', 'Успіх');
            setIsDeleteStaffModalOpen(false);
            setSelectedStaffMember(null);
            setIsStaffDetailsModalOpen(false);
        }
    };

    const handleSaveSchedule = (schedule: any) => {
        console.log('Збережено графік:', schedule);
        toast.success('Графік роботи оновлено', 'Успіх');
        setIsScheduleModalOpen(false);
    };

    const handleImportExcel = (file: File) => {
        console.log('Імпорт Excel файлу:', file.name);
    };

    const handleExportExcel = (options: ExportExcelOptions) => {
        console.log('Експорт в Excel з опціями:', options);
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

            <StaffStats staff={filteredStaff} />

            <StaffSegments
                activeStatus={activeStatus}
                onStatusChange={handleStatusChange}
            />

            <StaffFiltersBar
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={handleClearFilters}
            />

            {isLoading ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-11 gap-4 p-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Skeleton key={index} variant="rectangle" height="60px" />
                        ))}
                    </div>
                    <div className="flex justify-center">
                        <Skeleton variant="rectangle" width="300px" height="40px" />
                    </div>
                </div>
            ) : (
                <StaffTable
                    staff={paginatedStaff}
                    selectedStaff={selectedStaff}
                    onToggleStaff={handleToggleStaff}
                    onToggleAll={handleToggleAll}
                    onStaffClick={handleStaffClick}
                    onEditStaff={handleEditStaff}
                    onDeleteStaff={handleDeleteStaff}
                    onScheduleStaff={handleScheduleStaff}
                    onStatisticsStaff={handleStatisticsStaff}
                />
            )}

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

            <EditStaffModal
                isOpen={isEditStaffModalOpen}
                onClose={() => setIsEditStaffModalOpen(false)}
                onSave={handleUpdateStaff}
                staff={selectedStaffMember}
            />

            <StaffDetailsModal
                isOpen={isStaffDetailsModalOpen}
                onClose={() => setIsStaffDetailsModalOpen(false)}
                onEdit={() => {
                    setIsStaffDetailsModalOpen(false);
                    setIsEditStaffModalOpen(true);
                }}
                onDelete={() => {
                    setIsStaffDetailsModalOpen(false);
                    setIsDeleteStaffModalOpen(true);
                }}
                staff={selectedStaffMember}
            />

            <StaffScheduleModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                staff={selectedStaffMember}
                onSave={handleSaveSchedule}
            />

            <StaffStatisticsModal
                isOpen={isStatsModalOpen}
                onClose={() => setIsStatsModalOpen(false)}
                staff={selectedStaffMember}
            />

            <ConfirmDialog
                isOpen={isDeleteStaffModalOpen}
                onClose={() => setIsDeleteStaffModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Видалити співробітника?"
                message={`Ви впевнені, що хочете видалити співробітника "${selectedStaffMember?.firstName} ${selectedStaffMember?.middleName || ''} ${selectedStaffMember?.lastName || ''}"? Цю дію неможливо скасувати.`}
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
