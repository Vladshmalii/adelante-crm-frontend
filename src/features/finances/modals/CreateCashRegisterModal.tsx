'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Switch } from '@/shared/components/ui/Switch';
import type { CashRegister } from '../types';

interface CreateCashRegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<CashRegister, 'id'>) => void;
}

export function CreateCashRegisterModal({ isOpen, onClose, onSave }: CreateCashRegisterModalProps) {
    const [formData, setFormData] = useState<Omit<CashRegister, 'id'>>({
        name: '',
        location: '',
        balance: 0,
        isActive: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const handleChange = <K extends keyof Omit<CashRegister, 'id'>>(field: K, value: Omit<CashRegister, 'id'>[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Створити касу" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Назва каси"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Напр. Основна каса"
                />

                <Input
                    label="Розташування"
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="Напр. Перший поверх, біля входу"
                />

                <Input
                    label="Початковий баланс"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => handleChange('balance', Number(e.target.value))}
                    placeholder="0.00"
                />

                <Switch
                    label="Активна"
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
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
