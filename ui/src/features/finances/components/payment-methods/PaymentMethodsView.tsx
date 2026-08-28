'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PaymentMethodHeader } from './PaymentMethodHeader';
import { PaymentMethodsList } from './PaymentMethodsList';
import { EditPaymentMethodModal } from '../../modals/EditPaymentMethodModal';
import { CreateCashRegisterModal } from '../../modals/CreateCashRegisterModal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { Button } from '@/shared/components/ui/Button';
import { useToast } from '@/shared/hooks/useToast';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { useCashRegisters } from '../../hooks/useCashRegisters';
import { PaymentMethod } from '../../types';
import type { CreatePaymentMethodPayload } from '@/lib/api/finances';

export function PaymentMethodsView() {
    const toast = useToast();
    const { methods, createMethod, updateMethod } = usePaymentMethods();
    const { registers, createRegister } = useCashRegisters();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | undefined>();
    const [deleteMethod, setDeleteMethod] = useState<PaymentMethod | null>(null);
    const [isCashRegisterModalOpen, setIsCashRegisterModalOpen] = useState(false);

    const handleAddClick = () => {
        setEditingMethod(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (method: PaymentMethod) => {
        setEditingMethod(method);
        setIsModalOpen(true);
    };

    const handleToggle = async (method: PaymentMethod) => {
        try {
            await updateMethod(method.id, { isActive: !method.isActive });
        } catch (err) {
            toast.error(
                'Помилка',
                err instanceof Error ? err.message : 'Не вдалося змінити статус методу',
            );
        }
    };

    // Backend не підтримує видалення способів оплати — найближчий реальний
    // еквівалент це деактивація (isActive: false).
    const handleDelete = (method: PaymentMethod) => {
        setDeleteMethod(method);
    };

    const handleConfirmDelete = async () => {
        if (!deleteMethod) return;
        try {
            await updateMethod(deleteMethod.id, { isActive: false });
            toast.success('Метод оплати деактивовано', 'Успіх');
        } catch (err) {
            toast.error(
                'Помилка',
                err instanceof Error ? err.message : 'Не вдалося деактивувати метод оплати',
            );
        } finally {
            setDeleteMethod(null);
        }
    };

    const handleSave = async (data: PaymentMethod) => {
        const payload: CreatePaymentMethodPayload = {
            name: data.name || '',
            type: data.type || 'cash',
            cashRegisterId: data.cashRegisterId || undefined,
            commissionType: data.commissionType,
            commissionValue: data.commissionValue,
            commissionPayer: data.commissionPayer,
            availableOnline: data.availableOnline,
            allowPartialPayment: data.allowPartialPayment,
            allowTips: data.allowTips,
            sortOrder: data.sortOrder,
            isActive: data.isActive,
        };
        if (editingMethod) {
            await updateMethod(editingMethod.id, payload);
            toast.success('Метод оплати оновлено', 'Успіх');
        } else {
            await createMethod(payload);
            toast.success('Метод оплати створено', 'Успіх');
        }
        setEditingMethod(undefined);
    };

    const handleCreateRegister = async (data: {
        name: string;
        location?: string;
        isActive: boolean;
    }) => {
        try {
            await createRegister(data);
            toast.success('Касу створено', 'Успіх');
        } catch (err) {
            toast.error('Помилка', err instanceof Error ? err.message : 'Не вдалося створити касу');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <PaymentMethodHeader onAddClick={handleAddClick} />

            <div className="px-4 sm:px-6 pb-4 flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Каси:
                </span>
                {registers.map((r) => (
                    <span
                        key={r.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-secondary/60 text-foreground/80"
                    >
                        {r.name} · ₴ {r.balance.toLocaleString('uk-UA')}
                    </span>
                ))}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCashRegisterModalOpen(true)}
                    className="h-7 px-2 text-xs font-bold"
                >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Створити касу
                </Button>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-6 pt-0">
                <PaymentMethodsList
                    methods={methods.map((m) => ({
                        ...m,
                        cashRegister: registers.find((r) => r.id.toString() === m.cashRegisterId)
                            ?.name,
                    }))}
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
            <CreateCashRegisterModal
                isOpen={isCashRegisterModalOpen}
                onClose={() => setIsCashRegisterModalOpen(false)}
                onSave={handleCreateRegister}
            />
            <ConfirmDialog
                isOpen={!!deleteMethod}
                onClose={() => setDeleteMethod(null)}
                onConfirm={handleConfirmDelete}
                title="Деактивація методу оплати"
                message={`Видалення способів оплати не підтримується — метод "${deleteMethod?.name}" буде деактивовано і прихований з вибору.`}
                confirmText="Деактивувати"
                cancelText="Скасувати"
                variant="danger"
            />
        </div>
    );
}
