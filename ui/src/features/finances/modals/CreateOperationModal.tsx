'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Input } from '@/shared/components/ui/Input';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useCashRegisters } from '../hooks/useCashRegisters';
import type { CreateOperationPayload } from '@/lib/api/finances';

interface CreateOperationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateOperationPayload) => void | Promise<void>;
}

// Backend OperationType: income | expense | transfer (див. app/models/shard/finance.py)
const OPERATION_TYPES = [
    { value: 'income', label: 'Прихід' },
    { value: 'expense', label: 'Витрата' },
    { value: 'transfer', label: 'Переказ' },
];

export function CreateOperationModal({ isOpen, onClose, onSave }: CreateOperationModalProps) {
    const { methods } = usePaymentMethods();
    const { registers } = useCashRegisters();
    const [formData, setFormData] = useState<{
        date: string;
        cashRegisterId: string;
        amount: number;
        paymentMethodId: string;
        type: string;
        category: string;
        description: string;
    }>({
        date: new Date().toISOString().split('T')[0],
        cashRegisterId: '',
        amount: 0,
        paymentMethodId: '',
        type: 'income',
        category: '',
        description: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave({
            type: formData.type,
            amount: formData.amount,
            category: formData.category || undefined,
            description: formData.description || undefined,
            date: `${formData.date}T00:00:00.000Z`,
            paymentMethodId: formData.paymentMethodId || undefined,
            cashRegisterId: formData.cashRegisterId || undefined,
        });
        onClose();
    };

    const handleChange = <K extends keyof typeof formData>(
        field: K,
        value: (typeof formData)[K],
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Створити операцію" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <DatePicker
                    label="Дата"
                    value={formData.date}
                    onChange={(val) => handleChange('date', val)}
                />

                <Dropdown
                    label="Каса"
                    value={formData.cashRegisterId}
                    options={registers.map((r) => ({ value: r.id.toString(), label: r.name }))}
                    onChange={(val) => handleChange('cashRegisterId', val as string)}
                />

                <Dropdown
                    label="Спосіб оплати"
                    value={formData.paymentMethodId}
                    options={methods.map((m) => ({ value: m.id.toString(), label: m.name || '' }))}
                    onChange={(val) => handleChange('paymentMethodId', val as string)}
                />

                <Input
                    label="Сума (₴)"
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', Number(e.target.value))}
                />

                <Dropdown
                    label="Тип операції"
                    value={formData.type}
                    options={OPERATION_TYPES}
                    onChange={(val) => handleChange('type', val as string)}
                />

                <Input
                    label="Категорія"
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    placeholder="Напр. sales, rent, supplies..."
                />

                <Textarea
                    label="Опис"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Додаткова інформація..."
                    rows={3}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Скасувати
                    </Button>
                    <Button type="submit" variant="primary" disabled={formData.amount <= 0}>
                        Створити
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
