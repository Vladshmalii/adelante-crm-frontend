"use client";

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { OperationsFilters } from './OperationsFilters';
import { OperationsTable } from './OperationsTable';
import { CreateOperationModal } from '../../modals/CreateOperationModal';
import { EditOperationModal } from '../../modals/EditOperationModal';
import { OperationDetailsModal } from '../../modals/OperationDetailsModal';
import { Button } from '@/shared/components/ui/Button';
import { mockOperations } from '../../data/mockOperations';
import { FinanceOperation } from '../../types';

export function OperationsView() {

    const [dateFrom, setDateFrom] = useState('2025-11-22');
    const [dateTo, setDateTo] = useState('2025-11-28');
    const [operationType, setOperationType] = useState('all');
    const [cashRegister, setCashRegister] = useState('all');
    const [employee, setEmployee] = useState('all');
    const [clientSearch, setClientSearch] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedOperation, setSelectedOperation] = useState<FinanceOperation | null>(null);

    const handleApply = () => {
        console.log('Applying filters...');
    };

    const handleCreateOperation = (data: any) => {
        console.log('Create operation:', data);
        // TODO: Implement creation logic
    };

    const handleOpenDetails = (operation: FinanceOperation) => {
        setSelectedOperation(operation);
        setIsDetailsModalOpen(true);
    };

    const handleOpenEdit = (operation: FinanceOperation) => {
        setSelectedOperation(operation);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = (data: FinanceOperation) => {
        console.log('Edit operation:', data);
        setIsEditModalOpen(false);
        setSelectedOperation(null);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border bg-card flex justify-between items-center">
                <h2 className="text-lg font-semibold font-heading">Операції</h2>
                <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Створити операцію
                </Button>
            </div>

            <OperationsFilters
                dateFrom={dateFrom}
                dateTo={dateTo}
                operationType={operationType}
                cashRegister={cashRegister}
                employee={employee}
                clientSearch={clientSearch}
                paymentMethod={paymentMethod}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onOperationTypeChange={setOperationType}
                onCashRegisterChange={setCashRegister}
                onEmployeeChange={setEmployee}
                onClientSearchChange={setClientSearch}
                onPaymentMethodChange={setPaymentMethod}
                onApply={handleApply}
            />
            <div className="flex-1 overflow-auto">
                <OperationsTable
                    operations={mockOperations}
                    onView={handleOpenDetails}
                    onEdit={handleOpenEdit}
                />
            </div>

            <CreateOperationModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleCreateOperation}
            />

            <EditOperationModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                operation={selectedOperation}
                onSave={handleSaveEdit}
            />

            <OperationDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                operation={selectedOperation}
            />
        </div>
    );
}