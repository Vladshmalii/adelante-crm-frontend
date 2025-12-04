'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Input } from '@/shared/components/ui/Input';
import { Switch } from '@/shared/components/ui/Switch';
import type { PaymentMethod, PaymentMethodType, CommissionType, CommissionPayer } from '../types';

interface EditPaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentMethod: PaymentMethod | null;
    onSave: (data: PaymentMethod) => void;
}

const PAYMENT_METHOD_TYPES: { value: PaymentMethodType; label: string }[] = [
    { value: 'cash', label: 'Готівка' },
    { value: 'card', label: 'Картка' },
    { value: 'online', label: 'Онлайн-платіж' },
    { value: 'certificate', label: 'Сертифікат' },
    { value: 'bonus', label: 'Бонуси' },
    { value: 'tips', label: 'Чайові' },
    { value: 'other', label: 'Інше' },
];

const COMMISSION_TYPES: { value: CommissionType; label: string }[] = [
    { value: 'none', label: 'Без комісії' },
    { value: 'percentage', label: 'Відсоток' },
    { value: 'fixed', label: 'Фіксована сума' },
];

const COMMISSION_PAYERS: { value: CommissionPayer; label: string }[] = [
    { value: 'client', label: 'Клієнт' },
    { value: 'salon', label: 'Салон' },
    { value: 'split', label: 'Поділити' },
];

export function EditPaymentMethodModal({ isOpen, onClose, paymentMethod, onSave }: EditPaymentMethodModalProps) {
    const [formData, setFormData] = useState<PaymentMethod | null>(paymentMethod);

    useEffect(() => {
        if (paymentMethod) {
            setFormData(paymentMethod);
        } else {
            // Для создания нового метода - устанавливаем значения по умолчанию
            setFormData({
                id: '',
                name: '',
                type: 'cash',
                cashRegister: '',
                commissionType: 'none',
                commissionValue: 0,
                commissionPayer: 'client',
                availableOnline: false,
                allowPartialPayment: false,
                allowTips: false,
                sortOrder: 0,
                isActive: true,
            });
        }
    }, [paymentMethod, isOpen]);

    if (!formData) {
        return null;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const handleChange = <K extends keyof PaymentMethod>(field: K, value: PaymentMethod[K]) => {
        setFormData(prev => (prev ? { ...prev, [field]: value } : prev));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={paymentMethod ? "Редагувати метод оплати" : "Додати метод оплати"} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Назва методу"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Напр. Готівка, Visa/Mastercard"
                />

                <Dropdown
                    label="Тип методу"
                    value={formData.type}
                    options={PAYMENT_METHOD_TYPES}
                    onChange={(val) => handleChange('type', val as PaymentMethodType)}
                />

                <Input
                    label="Каса"
                    type="text"
                    required
                    value={formData.cashRegister}
                    onChange={(e) => handleChange('cashRegister', e.target.value)}
                    placeholder="Основна каса"
                />

                <div className="grid grid-cols-3 gap-4">
                    <Dropdown
                        label="Тип комісії"
                        value={formData.commissionType}
                        options={COMMISSION_TYPES}
                        onChange={(val) => handleChange('commissionType', val as CommissionType)}
                    />

                    <Input
                        label="Значення"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.commissionValue}
                        onChange={(e) => handleChange('commissionValue', Number(e.target.value))}
                        placeholder={formData.commissionType === 'percentage' ? '0-100' : '0.00'}
                    />

                    <Dropdown
                        label="Хто платить"
                        value={formData.commissionPayer}
                        options={COMMISSION_PAYERS}
                        onChange={(val) => handleChange('commissionPayer', val as CommissionPayer)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Switch
                        label="Доступний онлайн"
                        checked={formData.availableOnline}
                        onChange={(e) => handleChange('availableOnline', e.target.checked)}
                    />
                    <Switch
                        label="Дозволити часткову оплату"
                        checked={formData.allowPartialPayment}
                        onChange={(e) => handleChange('allowPartialPayment', e.target.checked)}
                    />
                    <Switch
                        label="Дозволити чайові"
                        checked={formData.allowTips}
                        onChange={(e) => handleChange('allowTips', e.target.checked)}
                    />
                    <Switch
                        label="Активний"
                        checked={formData.isActive}
                        onChange={(e) => handleChange('isActive', e.target.checked)}
                    />
                </div>

                <Input
                    label="Порядок сортування"
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) => handleChange('sortOrder', Number(e.target.value))}
                    placeholder="0"
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
                        {paymentMethod ? "Зберегти зміни" : "Додати"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
