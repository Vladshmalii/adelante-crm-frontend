'use client';

import { useState } from 'react';
import { PaymentMethodHeader } from './PaymentMethodHeader';
import { PaymentMethodsList } from './PaymentMethodsList';
import { PaymentMethodModal } from './PaymentMethodModal';
import { mockPaymentMethods } from '../../data/mockPaymentMethods';
import { PaymentMethod } from '../../types';

export function PaymentMethodsView() {
    const [methods, setMethods] = useState(mockPaymentMethods);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | undefined>();

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

    const handleSave = (data: Omit<PaymentMethod, 'id'>) => {
        if (editingMethod) {
            setMethods(prev =>
                prev.map(m =>
                    m.id === editingMethod.id ? { ...m, ...data } : m
                )
            );
        } else {
            const newMethod: PaymentMethod = {
                ...data,
                id: String(methods.length + 1),
            };
            setMethods(prev => [...prev, newMethod]);
        }
        setIsModalOpen(false);
        setEditingMethod(undefined);
    };

    return (
        <div className="flex flex-col h-full">
            <PaymentMethodHeader onAddClick={handleAddClick} />
            <div className="flex-1 overflow-auto p-4 sm:p-6">
                <PaymentMethodsList
                    methods={methods}
                    onEdit={handleEdit}
                    onToggle={handleToggle}
                />
            </div>
            <PaymentMethodModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingMethod(undefined);
                }}
                onSave={handleSave}
                initialData={editingMethod}
            />
        </div>
    );
}