'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import type { FinanceReceipt, ReceiptStatus, ReceiptSource } from '../types';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Dropdown } from '@/shared/components/ui/Dropdown';

interface EditReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    receipt: FinanceReceipt | null;
    onSave: (data: FinanceReceipt) => void;
}

const RECEIPT_STATUSES: { value: ReceiptStatus; label: string }[] = [
    { value: 'paid', label: 'Оплачено' },
    { value: 'cancelled', label: 'Скасовано' },
    { value: 'partial', label: 'Часткова оплата' },
];

const RECEIPT_SOURCES: { value: ReceiptSource; label: string }[] = [
    { value: 'web', label: 'Веб' },
    { value: 'mobile', label: 'Мобільний застосунок' },
    { value: 'pos', label: 'POS-термінал' },
];

export function EditReceiptModal({ isOpen, onClose, receipt, onSave }: EditReceiptModalProps) {
    const [formData, setFormData] = useState<FinanceReceipt | null>(receipt);

    useEffect(() => {
        setFormData(receipt);
    }, [receipt, isOpen]);

    if (!formData) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Редагувати чек" size="md">
                <div className="text-sm text-muted-foreground">Оберіть чек для редагування.</div>
            </Modal>
        );
    }

    const handleChange = <K extends keyof FinanceReceipt>(field: K, value: FinanceReceipt[K]) => {
        setFormData(prev => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Редагувати чек" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Номер чеку"
                        type="text"
                        required
                        value={formData.receiptNumber}
                        onChange={(e) => handleChange('receiptNumber', e.target.value)}
                    />
                    <Input
                        label="№ документа"
                        type="text"
                        required
                        value={formData.documentNumber}
                        onChange={(e) => handleChange('documentNumber', e.target.value)}
                    />
                    <DatePicker
                        label="Дата"
                        value={formData.date}
                        onChange={(val) => handleChange('date', val)}
                    />
                    <Input
                        label="Каса"
                        type="text"
                        required
                        value={formData.cashRegister}
                        onChange={(e) => handleChange('cashRegister', e.target.value)}
                    />
                </div>

                <Input
                    label="Клієнт"
                    type="text"
                    required
                    value={formData.client}
                    onChange={(e) => handleChange('client', e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                        label="Сума (₴)"
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => handleChange('amount', Number(e.target.value))}
                    />
                    <Input
                        label="Залишок у касі (₴)"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.balanceAfter}
                        onChange={(e) => handleChange('balanceAfter', Number(e.target.value))}
                    />
                    <Input
                        label="Метод оплати"
                        type="text"
                        required
                        value={formData.paymentMethod}
                        onChange={(e) => handleChange('paymentMethod', e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Dropdown
                        label="Статус"
                        value={formData.status}
                        options={RECEIPT_STATUSES}
                        onChange={(val) => handleChange('status', val as ReceiptStatus)}
                    />
                    <Dropdown
                        label="Джерело"
                        value={formData.source}
                        options={RECEIPT_SOURCES}
                        onChange={(val) => handleChange('source', val as ReceiptSource)}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                    >
                        Скасувати
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                    >
                        Зберегти зміни
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
