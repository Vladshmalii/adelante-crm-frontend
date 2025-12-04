'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Input } from '@/shared/components/ui/Input';
import type { OperationType, OperationStatus } from '../types';

interface CreateOperationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
}

const OPERATION_TYPES: { value: OperationType; label: string }[] = [
    { value: 'payment', label: 'Оплата' },
    { value: 'refund', label: 'Повернення' },
    { value: 'transfer', label: 'Переказ' },
    { value: 'withdrawal', label: 'Зняття' },
    { value: 'deposit', label: 'Внесення' },
];

const OPERATION_STATUSES: { value: OperationStatus; label: string }[] = [
    { value: 'completed', label: 'Завершено' },
    { value: 'pending', label: 'В обробці' },
    { value: 'cancelled', label: 'Скасовано' },
];

export function CreateOperationModal({ isOpen, onClose, onSave }: CreateOperationModalProps) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        documentNumber: '',
        cashRegister: '',
        client: '',
        amount: 0,
        paymentMethod: '',
        type: 'payment' as OperationType,
        status: 'completed' as OperationStatus,
        author: 'Адміністратор',
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Створити операцію" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <DatePicker
                    label="Дата"
                    value={formData.date}
                    onChange={(val) => handleChange('date', val)}
                />

                <Input
                    label="Номер документа"
                    type="text"
                    required
                    value={formData.documentNumber}
                    onChange={(e) => handleChange('documentNumber', e.target.value)}
                />

                <Input
                    label="Каса"
                    type="text"
                    required
                    value={formData.cashRegister}
                    onChange={(e) => handleChange('cashRegister', e.target.value)}
                    placeholder="Основна каса"
                />

                <Input
                    label="Клієнт"
                    type="text"
                    required
                    value={formData.client}
                    onChange={(e) => handleChange('client', e.target.value)}
                />

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
                    label="Спосіб оплати"
                    type="text"
                    required
                    value={formData.paymentMethod}
                    onChange={(e) => handleChange('paymentMethod', e.target.value)}
                    placeholder="Готівка, Картка..."
                />

                <Dropdown
                    label="Тип операції"
                    value={formData.type}
                    options={OPERATION_TYPES}
                    onChange={(val) => handleChange('type', val)}
                />

                <Dropdown
                    label="Статус"
                    value={formData.status}
                    options={OPERATION_STATUSES}
                    onChange={(val) => handleChange('status', val)}
                />

                <Textarea
                    label="Опис"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Додаткова інформація..."
                    rows={3}
                />

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
                        Створити
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
