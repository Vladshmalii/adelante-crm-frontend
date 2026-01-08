"use client";

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { OperationsFilters } from './OperationsFilters';
import { OperationsTable } from './OperationsTable';
import { CreateOperationModal } from '../../modals/CreateOperationModal';
import { EditOperationModal } from '../../modals/EditOperationModal';
import { OperationDetailsModal } from '../../modals/OperationDetailsModal';
import { Button } from '@/shared/components/ui/Button';
import { FinanceOperation } from '../../types';
import { useFinances } from '../../hooks/useFinances';
import { GlobalLoader } from '@/shared/components/ui/GlobalLoader';
import { useToast } from '@/shared/hooks/useToast';
import { USE_MOCK_DATA } from '@/lib/config';

export function OperationsView() {

    const [dateFrom, setDateFrom] = useState('2025-12-29');
    const [dateTo, setDateTo] = useState('2026-01-04');
    const [operationType, setOperationType] = useState('all');
    const [cashRegister, setCashRegister] = useState('all');
    const [employee, setEmployee] = useState('all');
    const [clientSearch, setClientSearch] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedOperation, setSelectedOperation] = useState<FinanceOperation | null>(null);
    const [isLocalLoading, setIsLocalLoading] = useState(false);
    const toast = useToast();

    const {
        operations,
        isLoading,
        error,
        loadOperations,
        createOperation,
    } = useFinances({
        dateFrom,
        dateTo,
        type: operationType === 'all' ? undefined : operationType,
    });

    useEffect(() => {
        if (error) toast.error('Помилка', error);
    }, [error, toast]);

    useEffect(() => {
        loadOperations();
    }, [dateFrom, dateTo, operationType]);

    const handleApply = () => {
        loadOperations();
    };

    const handleCreateOperation = async (data: any) => {
        setIsLocalLoading(true);
        try {
            await createOperation({
                ...data,
                date: data.date || dateTo,
            });
            toast.success('Операцію створено', 'Успіх');
            setIsCreateModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error('Помилка', err instanceof Error ? err.message : 'Не вдалося створити операцію');
        } finally {
            setIsLocalLoading(false);
        }
    };

    const handleOpenDetails = (operation: FinanceOperation) => {
        setSelectedOperation(operation);
        setIsDetailsModalOpen(true);
    };

    const handleOpenEdit = (operation: FinanceOperation) => {
        setSelectedOperation(operation);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = () => {
        toast.info('Редагування', USE_MOCK_DATA ? 'Демо режим: зміни не зберігаються' : 'API не підтримує оновлення операцій');
        setIsEditModalOpen(false);
        setSelectedOperation(null);
    };

    const filteredOperations = useMemo(() => {
        let result = [...operations];
        if (clientSearch) {
            const query = clientSearch.toLowerCase();
            result = result.filter((op) => (op as any).counterparty?.toLowerCase().includes(query));
        }
        if (paymentMethod !== 'all') {
            result = result.filter((op) => (op as any).paymentMethodId?.toString() === paymentMethod);
        }
        return result;
    }, [operations, clientSearch, paymentMethod]);

    return (
        <div className="flex flex-col h-full">
            <GlobalLoader isLoading={isLoading || isLocalLoading} />
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
                    operations={filteredOperations}
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