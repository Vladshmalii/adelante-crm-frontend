'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Switch } from '@/shared/components/ui/Switch';
import type { CashRegister } from '../types';

interface EditCashRegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    cashRegister: CashRegister | null;
    onSave: (data: CashRegister) => void;
}

export function EditCashRegisterModal({ isOpen, onClose, cashRegister, onSave }: EditCashRegisterModalProps) {
    const [formData, setFormData] = useState<CashRegister | null>(cashRegister);

    useEffect(() => {
        setFormData(cashRegister);
    }, [cashRegister, isOpen]);

    if (!formData) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Редагувати касу" size="md">
                <div className="text-sm text-muted-foreground">Оберіть касу для редагування.</div>
            </Modal>
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const handleChange = <K extends keyof CashRegister>(field: K, value: CashRegister[K]) => {
        setFormData(prev => (prev ? { ...prev, [field]: value } : prev));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Редагувати касу" size="md">
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
                    label="Поточний баланс"
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
                        Зберегти зміни
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
