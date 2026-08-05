'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ReceiptsFilters } from './ReceiptsFilters';
import { ReceiptsTable } from './ReceiptsTable';
import { mockReceipts } from '../../data/mockReceipts';
import { FinanceReceipt } from '../../types';
import { Button } from '@/shared/components/ui/Button';
import { CreateReceiptModal } from '../../modals/CreateReceiptModal';
import { EditReceiptModal } from '../../modals/EditReceiptModal';
import { ReceiptDetailsModal } from '../../modals/ReceiptDetailsModal';

export function ReceiptsView() {
    const [dateFrom, setDateFrom] = useState('2025-12-29');
    const [dateTo, setDateTo] = useState('2026-01-04');
    const [cashRegister, setCashRegister] = useState('all');
    const [employee, setEmployee] = useState('all');
    const [status, setStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<FinanceReceipt | null>(null);

    const filteredReceipts = mockReceipts.filter(
        (r) =>
            r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const handleApply = () => {
        console.log('Applying filters...');
    };

    const handleCreateReceipt = (data: Omit<FinanceReceipt, 'id'>) => {
        console.log('Create receipt:', data);
    };

    const handleOpenDetails = (receipt: FinanceReceipt) => {
        setSelectedReceipt(receipt);
        setIsDetailsModalOpen(true);
    };

    const handleOpenEdit = (receipt: FinanceReceipt) => {
        setSelectedReceipt(receipt);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = (data: FinanceReceipt) => {
        console.log('Edit receipt:', data);
        setIsEditModalOpen(false);
        setSelectedReceipt(null);
    };

    return (
        <div className="flex h-full flex-col">
            <div className="mb-6 flex items-center justify-between border-b border-border bg-card p-4">
                <h2 className="font-heading text-lg font-semibold">Каси / чеки</h2>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    variant="primary"
                    className="h-[42px] rounded-xl px-6 font-bold"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Створити чек
                </Button>
            </div>

            <ReceiptsFilters
                dateFrom={dateFrom}
                dateTo={dateTo}
                cashRegister={cashRegister}
                employee={employee}
                status={status}
                searchQuery={searchQuery}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onCashRegisterChange={setCashRegister}
                onEmployeeChange={setEmployee}
                onStatusChange={setStatus}
                onSearchQueryChange={setSearchQuery}
                onApply={handleApply}
            />
            <div className="flex-1 overflow-auto">
                <ReceiptsTable
                    receipts={filteredReceipts}
                    onView={handleOpenDetails}
                    onEdit={handleOpenEdit}
                />
            </div>

            <CreateReceiptModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleCreateReceipt}
            />

            <EditReceiptModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                receipt={selectedReceipt}
                onSave={handleSaveEdit}
            />

            <ReceiptDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                receipt={selectedReceipt}
            />
        </div>
    );
}
