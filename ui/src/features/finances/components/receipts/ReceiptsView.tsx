'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { ReceiptsFilters } from './ReceiptsFilters';
import { ReceiptsTable } from './ReceiptsTable';
import { FinanceReceipt } from '../../types';
import { Button } from '@/shared/components/ui/Button';
import { CreateReceiptModal } from '../../modals/CreateReceiptModal';
import { ReceiptDetailsModal } from '../../modals/ReceiptDetailsModal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { useReceipts } from '../../hooks/useReceipts';
import { useToast } from '@/shared/hooks/useToast';
import { USE_MOCK_DATA } from '@/lib/config';
import type { CreateReceiptPayload } from '@/lib/api/finances';

export function ReceiptsView() {
    const [dateFrom, setDateFrom] = useState('2025-12-29');
    const [dateTo, setDateTo] = useState('2026-01-04');
    const [cashRegister, setCashRegister] = useState('all');
    const [employee, setEmployee] = useState('all');
    const [status, setStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<FinanceReceipt | null>(null);
    const [selectedReceipt, setSelectedReceipt] = useState<FinanceReceipt | null>(null);
    const toast = useToast();

    const { receipts, error, load, createReceipt, cancelReceipt } = useReceipts();

    useEffect(() => {
        if (error) toast.error('Помилка', error);
    }, [error, toast]);

    useEffect(() => {
        load({ status: status === 'all' ? undefined : status, dateFrom, dateTo });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredReceipts = useMemo(() => {
        return receipts.filter(
            (r) =>
                r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.client.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }, [receipts, searchQuery]);

    const handleApply = () => {
        load({ status: status === 'all' ? undefined : status, dateFrom, dateTo });
    };

    const handleCreateReceipt = async (data: CreateReceiptPayload) => {
        try {
            await createReceipt(data);
            toast.success('Чек створено', 'Успіх');
        } catch (err) {
            toast.error('Помилка', err instanceof Error ? err.message : 'Не вдалося створити чек');
            throw err;
        }
    };

    const handleOpenDetails = (receipt: FinanceReceipt) => {
        setSelectedReceipt(receipt);
        setIsDetailsModalOpen(true);
    };

    // Backend не підтримує редагування чеків — тільки скасування, тому
    // друга дія в таблиці веде на підтвердження скасування, а не форму.
    const handleRequestCancel = (receipt: FinanceReceipt) => {
        if (USE_MOCK_DATA) {
            toast.info('Демо режим', 'Скасування недоступне в демо-режимі');
            return;
        }
        setCancelTarget(receipt);
    };

    const handleConfirmCancel = async () => {
        if (!cancelTarget) return;
        try {
            await cancelReceipt(cancelTarget.id);
            toast.success('Чек скасовано', 'Успіх');
        } catch (err) {
            toast.error('Помилка', err instanceof Error ? err.message : 'Не вдалося скасувати чек');
        } finally {
            setCancelTarget(null);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border bg-card flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold font-heading">Каси / чеки</h2>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    variant="primary"
                    className="h-[42px] px-6 rounded-xl font-bold"
                >
                    <Plus className="w-5 h-5 mr-2" />
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
                    onEdit={handleRequestCancel}
                />
            </div>

            <CreateReceiptModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleCreateReceipt}
            />

            <ReceiptDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                receipt={selectedReceipt}
            />

            <ConfirmDialog
                isOpen={!!cancelTarget}
                onClose={() => setCancelTarget(null)}
                onConfirm={handleConfirmCancel}
                title="Скасувати чек?"
                message={`Чек "${cancelTarget?.receiptNumber}" та повʼязані з ним операції будуть позначені як скасовані. Цю дію неможливо повернути.`}
                confirmText="Скасувати чек"
                cancelText="Назад"
                variant="danger"
            />
        </div>
    );
}
