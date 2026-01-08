'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Product, StockMovementFormData } from '../types';
import { PRODUCT_UNITS } from '../constants';

interface StockMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: StockMovementFormData) => void;
    product: Product | null;
}

export function StockMovementModal({ isOpen, onClose, onSave, product }: StockMovementModalProps) {
    const [formData, setFormData] = useState<StockMovementFormData>({
        productId: '',
        type: 'in',
        quantity: 0,
        reason: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (product) {
            onSave({ ...formData, productId: String(product.id) });
        }
        onClose();
    };

    const handleChange = (field: keyof StockMovementFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!product) return null;

    const unitLabel = PRODUCT_UNITS.find(u => u.value === product.unit)?.label || product.unit;

    const movementTypes = [
        { value: 'in', label: 'Надходження товару' },
        { value: 'out', label: 'Списання / Витрата' },
        { value: 'adjustment', label: 'Коригування (інвентаризація)' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Рух товару: ${product.name}`} size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 bg-secondary/30 rounded-lg text-sm">
                    <p className="text-muted-foreground">Поточний залишок:</p>
                    <p className="text-lg font-bold text-foreground">{product.quantity} {unitLabel}</p>
                </div>

                <Dropdown
                    label="Тип операції"
                    value={formData.type}
                    options={movementTypes}
                    onChange={(val) => handleChange('type', val)}
                />

                <Input
                    label={`Кількість (${unitLabel})`}
                    type="number"
                    min="0"
                    step={product.type === 'weight' ? '0.001' : '1'}
                    required
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', Number(e.target.value))}
                />

                <Textarea
                    label="Причина / Коментар"
                    value={formData.reason}
                    onChange={(e) => handleChange('reason', e.target.value)}
                    placeholder="Наприклад: Поставка №123 або Використано в роботі"
                    rows={3}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Скасувати
                    </Button>
                    <Button type="submit" variant="primary">
                        Зберегти
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
