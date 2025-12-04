'use client';

import { useState } from 'react';
import { PaymentMethodHeader } from './PaymentMethodHeader';
import { PaymentMethodsList } from './PaymentMethodsList';
import { EditPaymentMethodModal } from '../../modals/EditPaymentMethodModal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { mockPaymentMethods } from '../../data/mockPaymentMethods';
import { PaymentMethod } from '../../types';

export function PaymentMethodsView() {
    const [methods, setMethods] = useState(mockPaymentMethods);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | undefined>();
    const [deleteMethod, setDeleteMethod] = useState<PaymentMethod | null>(null);

    const handleAddClick = () => {
        setEditingMethod(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (method: PaymentMethod) => {
        setEditingMethod(method);
        setIsModalOpen(true);
    };

    const handleToggle = (method: PaymentMethod) => {
        setMethods(prev =>
            prev.map(m =>
                m.id === method.id ? { ...m, isActive: !m.isActive } : m
            )
        );
    };

    const handleDelete = (method: PaymentMethod) => {
        setDeleteMethod(method);
    };

    const handleConfirmDelete = () => {
        if (deleteMethod) {
            setMethods(prev => prev.filter(m => m.id !== deleteMethod.id));
            setDeleteMethod(null);
        }
    };

    const handleSave = (data: PaymentMethod) => {
        if (editingMethod) {
            // Редактирование существующего метода
            setMethods(prev =>
                prev.map(m =>
                    m.id === editingMethod.id ? { ...m, ...data } : m
                )
            );
        } else {
            // Создание нового метода - генерируем временный id
            const newMethod: PaymentMethod = {
                ...data,
                id: `temp_${Date.now()}`,
            };
            setMethods(prev => [...prev, newMethod]);
        }
        setIsModalOpen(false);
        setEditingMethod(undefined);
    };

    return (
        <div className="flex flex-col h-full">
            <PaymentMethodHeader
                onAddClick={handleAddClick}
            />
            <div className="flex-1 overflow-auto p-4 sm:p-6">
                <PaymentMethodsList
                    methods={methods}
                    onEdit={handleEdit}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                />
            </div>
            <EditPaymentMethodModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingMethod(undefined);
                }}
                onSave={handleSave}
                paymentMethod={editingMethod || null}
            />
            <ConfirmDialog
                isOpen={!!deleteMethod}
                onClose={() => setDeleteMethod(null)}
                onConfirm={handleConfirmDelete}
                title="Видалення методу оплати"
                message={`Ви впевнені, що хочете видалити метод оплати "${deleteMethod?.name}"? Цю дію неможливо скасувати.`}
                confirmText="Видалити"
                cancelText="Скасувати"
                variant="danger"
            />
        </div>
    );
}