"use client";

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
    const [dateFrom, setDateFrom] = useState('2025-11-22');
    const [dateTo, setDateTo] = useState('2025-11-28');
    const [cashRegister, setCashRegister] = useState('all');
    const [employee, setEmployee] = useState('all');
    const [status, setStatus] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<FinanceReceipt | null>(null);

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
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border bg-card flex justify-between items-center">
                <h2 className="text-lg font-semibold font-heading">Каси / чеки</h2>
                <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Створити чек
                </Button>
            </div>

            <ReceiptsFilters
                dateFrom={dateFrom}
                dateTo={dateTo}
                cashRegister={cashRegister}
                employee={employee}
                status={status}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onCashRegisterChange={setCashRegister}
                onEmployeeChange={setEmployee}
                onStatusChange={setStatus}
                onApply={handleApply}
            />
            <div className="flex-1 overflow-auto">
                <ReceiptsTable
                    receipts={mockReceipts}
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