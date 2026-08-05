'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Minus, Plus } from 'lucide-react';
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
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    if (!product) return null;

    const unitLabel = PRODUCT_UNITS.find((u) => u.value === product.unit)?.label || product.unit;

    const movementTypes = [
        { value: 'in', label: 'Надходження товару' },
        { value: 'out', label: 'Списання / Витрата' },
        { value: 'adjustment', label: 'Коригування (інвентаризація)' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Рух товару: ${product.name}`} size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="rounded-lg bg-secondary/30 p-3 text-sm">
                    <p className="text-muted-foreground">Поточний залишок:</p>
                    <p className="text-lg font-bold text-foreground">
                        {product.quantity} {unitLabel}
                    </p>
                </div>

                <Dropdown
                    label="Тип операції"
                    value={formData.type}
                    options={movementTypes}
                    onChange={(val) => handleChange('type', val)}
                />

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                        Кількість ({unitLabel})
                    </label>
                    <div className="flex h-[42px] items-center rounded-xl border border-border bg-background p-1 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                        <button
                            type="button"
                            onClick={() =>
                                handleChange(
                                    'quantity',
                                    Math.max(
                                        0,
                                        (formData.quantity || 0) -
                                            (product.type === 'weight' ? 0.1 : 1),
                                    ),
                                )
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-primary"
                        >
                            <Minus size={14} strokeWidth={3} />
                        </button>
                        <input
                            type="number"
                            step={product.type === 'weight' ? 0.001 : 1}
                            value={formData.quantity}
                            onChange={(e) => handleChange('quantity', Number(e.target.value))}
                            className="flex-1 bg-transparent text-center text-sm font-bold text-foreground [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                handleChange(
                                    'quantity',
                                    (formData.quantity || 0) +
                                        (product.type === 'weight' ? 0.1 : 1),
                                )
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-primary"
                        >
                            <Plus size={14} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                <Textarea
                    label="Причина / Коментар"
                    value={formData.reason}
                    onChange={(e) => handleChange('reason', e.target.value)}
                    placeholder="Наприклад: Поставка №123 або Використано в роботі"
                    rows={3}
                />

                <div className="flex justify-end gap-3 border-t border-border pt-4">
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
