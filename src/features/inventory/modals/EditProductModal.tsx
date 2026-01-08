'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Product, AddProductFormData, ProductCategory, ProductType, ProductUnit } from '../types';
import { PRODUCT_CATEGORIES, PRODUCT_TYPES, PRODUCT_UNITS } from '../constants';

interface EditProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, data: AddProductFormData) => void;
    product: Product | null;
}

export function EditProductModal({ isOpen, onClose, onSave, product }: EditProductModalProps) {
    const toast = useToast();
    const [formData, setFormData] = useState<AddProductFormData>({
        name: '',
        sku: '',
        category: 'professional',
        type: 'item',
        quantity: 0,
        unit: 'pcs',
        price: 0,
        costPrice: 0,
        minQuantity: 0,
        description: '',
    });

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                sku: product.sku,
                category: product.category as ProductCategory,
                type: product.type as ProductType,
                quantity: product.quantity,
                unit: product.unit as ProductUnit,
                price: product.price,
                costPrice: product.costPrice,
                minQuantity: product.minQuantity,
                description: product.description || '',
            });
        }
    }, [product]);

    // Оновлюємо доступні одиниці виміру при зміні типу товару
    useEffect(() => {
        if (!product) return; // Не змінюємо при ініціалізації
        const availableUnits = PRODUCT_UNITS.filter(u => u.type.includes(formData.type));
        const isCurrentUnitValid = availableUnits.some(u => u.value === formData.unit);

        if (!isCurrentUnitValid) {
            const defaultUnit = formData.type === 'item' ? 'pcs' : 'ml';
            setFormData(prev => ({ ...prev, unit: defaultUnit }));
        }
    }, [formData.type]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (product) {
            onSave(String(product.id), formData);
            toast.success('Товар оновлено', 'Успіх');
        }
        onClose();
    };

    const handleChange = (field: keyof AddProductFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const availableUnits = PRODUCT_UNITS.filter(u => u.type.includes(formData.type));

    if (!product) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Редагувати товар" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Dropdown
                        label="Категорія"
                        value={formData.category}
                        options={PRODUCT_CATEGORIES}
                        onChange={(val) => handleChange('category', val)}
                    />
                    <Dropdown
                        label="Тип товару"
                        value={formData.type}
                        options={PRODUCT_TYPES}
                        onChange={(val) => handleChange('type', val)}
                    />
                </div>

                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                    <h4 className="text-sm font-medium mb-3 text-foreground">Параметри обліку</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="Поточний залишок"
                            type="number"
                            min="0"
                            step={formData.type === 'weight' ? '0.001' : '1'}
                            required
                            value={formData.quantity}
                            onChange={(e) => handleChange('quantity', Number(e.target.value))}
                        />
                        <Dropdown
                            label="Одиниця виміру"
                            value={formData.unit}
                            options={availableUnits}
                            onChange={(val) => handleChange('unit', val)}
                        />
                        <Input
                            label="Мін. залишок (для сповіщень)"
                            type="number"
                            min="0"
                            step={formData.type === 'weight' ? '0.001' : '1'}
                            required
                            value={formData.minQuantity}
                            onChange={(e) => handleChange('minQuantity', Number(e.target.value))}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Собівартість (за од.)"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={formData.costPrice}
                        onChange={(e) => handleChange('costPrice', Number(e.target.value))}
                    />
                    <Input
                        label="Ціна продажу (за од.)"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={(e) => handleChange('price', Number(e.target.value))}
                    />
                </div>

                <Textarea
                    label="Опис"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Скасувати
                    </Button>
                    <Button type="submit" variant="primary">
                        Зберегти зміни
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
