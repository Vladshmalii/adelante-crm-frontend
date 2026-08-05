'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Minus, Plus } from 'lucide-react';
import { Textarea } from '@/shared/components/ui/Textarea';
import { useToast } from '@/shared/hooks/useToast';
import { AddProductFormData, ProductUnit } from '../types';
import { PRODUCT_UNITS } from '../constants';
import { useInventoryStore } from '@/stores/useInventoryStore';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: AddProductFormData) => void;
}

export function AddProductModal({ isOpen, onClose, onSave }: AddProductModalProps) {
    const categories = useInventoryStore((state) => state.categories);
    const toast = useToast();

    const [formData, setFormData] = useState<AddProductFormData>({
        name: '',
        sku: '',
        category: 'professional',
        quantity: 0,
        unit: 'pcs',
        price: 0,
        costPrice: 0,
        minQuantity: 0,
        description: '',
    });

    useEffect(() => {
        if (formData.unit === 'pcs') {
            setFormData((prev) => ({ ...prev, packageVolume: undefined }));
        }
    }, [formData.unit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        toast.success('Товар додано', 'Успіх');
        onClose();
    };

    const handleChange = (field: keyof AddProductFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const availableUnits = PRODUCT_UNITS;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Додати новий товар" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                        label="Назва товару"
                        required
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                    />
                    <Input
                        label="Артикул (SKU)"
                        required
                        value={formData.sku}
                        onChange={(e) => handleChange('sku', e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <Dropdown
                        label="Категорія"
                        value={formData.category}
                        options={categories}
                        onChange={(val) => handleChange('category', val)}
                    />
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div
                        className={`grid grid-cols-1 ${formData.unit !== 'pcs' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}
                    >
                        {formData.unit !== 'pcs' && (
                            <div className="space-y-1.5">
                                <label className="truncate text-sm font-medium text-foreground">
                                    Об'єм 1 уп. ({formData.unit})
                                </label>
                                <div className="flex h-[42px] items-center rounded-xl border border-border bg-background p-1 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                                    <input
                                        type="number"
                                        step="1"
                                        value={formData.packageVolume || ''}
                                        onChange={(e) =>
                                            handleChange(
                                                'packageVolume',
                                                e.target.value ? Number(e.target.value) : undefined,
                                            )
                                        }
                                        placeholder="Необов'язково"
                                        className="flex-1 bg-transparent text-center text-sm font-bold text-foreground [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <label className="truncate text-sm font-medium text-foreground">
                                Залишок ({formData.unit})
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
                                                    (formData.unit !== 'pcs' ? 0.1 : 1),
                                            ),
                                        )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-primary"
                                >
                                    <Minus size={14} strokeWidth={3} />
                                </button>
                                <input
                                    type="number"
                                    step={formData.unit !== 'pcs' ? 0.001 : 1}
                                    value={formData.quantity}
                                    onChange={(e) =>
                                        handleChange('quantity', Number(e.target.value))
                                    }
                                    className="flex-1 bg-transparent text-center text-sm font-bold text-foreground [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleChange(
                                            'quantity',
                                            (formData.quantity || 0) +
                                                (formData.unit !== 'pcs' ? 0.1 : 1),
                                        )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-primary"
                                >
                                    <Plus size={14} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">
                                Одиниця виміру
                            </label>
                            <Dropdown
                                value={formData.unit}
                                options={availableUnits}
                                onChange={(val) => handleChange('unit', val)}
                                className="h-[42px] rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">
                                Мін. залишок
                            </label>
                            <div className="flex h-[42px] items-center rounded-xl border border-border bg-background p-1 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleChange(
                                            'minQuantity',
                                            Math.max(
                                                0,
                                                (formData.minQuantity || 0) -
                                                    (formData.unit !== 'pcs' ? 0.1 : 1),
                                            ),
                                        )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-primary"
                                >
                                    <Minus size={14} strokeWidth={3} />
                                </button>
                                <input
                                    type="number"
                                    step={formData.unit !== 'pcs' ? 0.001 : 1}
                                    value={formData.minQuantity}
                                    onChange={(e) =>
                                        handleChange('minQuantity', Number(e.target.value))
                                    }
                                    className="flex-1 bg-transparent text-center text-sm font-bold text-foreground [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleChange(
                                            'minQuantity',
                                            (formData.minQuantity || 0) +
                                                (formData.unit !== 'pcs' ? 0.1 : 1),
                                        )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-primary"
                                >
                                    <Plus size={14} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Собівартість</label>
                        <div className="flex h-[42px] items-center rounded-xl border border-border bg-background p-1 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                            <button
                                type="button"
                                onClick={() =>
                                    handleChange(
                                        'costPrice',
                                        Math.max(0, (formData.costPrice || 0) - 10),
                                    )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-primary"
                            >
                                <Minus size={14} strokeWidth={3} />
                            </button>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.costPrice}
                                onChange={(e) => handleChange('costPrice', Number(e.target.value))}
                                className="flex-1 bg-transparent text-center text-sm font-bold text-foreground [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    handleChange('costPrice', (formData.costPrice || 0) + 10)
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-primary"
                            >
                                <Plus size={14} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Ціна продажу</label>
                        <div className="flex h-[42px] items-center rounded-xl border border-border bg-background p-1 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                            <button
                                type="button"
                                onClick={() =>
                                    handleChange('price', Math.max(0, (formData.price || 0) - 10))
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-primary"
                            >
                                <Minus size={14} strokeWidth={3} />
                            </button>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => handleChange('price', Number(e.target.value))}
                                className="flex-1 bg-transparent text-center text-sm font-bold text-foreground [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <button
                                type="button"
                                onClick={() => handleChange('price', (formData.price || 0) + 10)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-primary"
                            >
                                <Plus size={14} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                </div>

                <Textarea
                    label="Опис"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
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
