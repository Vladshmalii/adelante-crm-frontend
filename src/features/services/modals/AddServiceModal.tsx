'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Input } from '@/shared/components/ui/Input';
import { SERVICE_CATEGORIES, SERVICE_STATUSES } from '../constants';
import type { AddServiceFormData, ServiceCategory, ServiceStatus } from '../types';

interface AddServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: AddServiceFormData) => void;
}

const COLOR_OPTIONS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16',
    '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
    '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
];

export function AddServiceModal({ isOpen, onClose, onSave }: AddServiceModalProps) {
    const [formData, setFormData] = useState<AddServiceFormData>({
        name: '',
        category: 'hair',
        duration: 60,
        price: 0,
        status: 'active',
        color: COLOR_OPTIONS[0],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
        setFormData({
            name: '',
            category: 'hair',
            duration: 60,
            price: 0,
            status: 'active',
            color: COLOR_OPTIONS[0],
        });
    };

    const handleChange = (field: keyof AddServiceFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Додати послугу" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Назва послуги"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Наприклад: Стрижка жіноча"
                />

                <Dropdown
                    label="Категорія"
                    value={formData.category}
                    options={SERVICE_CATEGORIES}
                    onChange={(val) => handleChange('category', val as ServiceCategory)}
                />

                <Textarea
                    label="Опис"
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Опис послуги..."
                    rows={3}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Тривалість (хв)"
                        type="number"
                        required
                        min="5"
                        step="5"
                        value={formData.duration}
                        onChange={(e) => handleChange('duration', Number(e.target.value))}
                    />

                    <Input
                        label="Ціна (₴)"
                        type="number"
                        required
                        min="0"
                        value={formData.price}
                        onChange={(e) => handleChange('price', Number(e.target.value))}
                    />
                </div>

                <Dropdown
                    label="Статус"
                    value={formData.status}
                    options={SERVICE_STATUSES}
                    onChange={(val) => handleChange('status', val as ServiceStatus)}
                />

                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        Колір
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {COLOR_OPTIONS.map(color => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => handleChange('color', color)}
                                className={`w-8 h-8 rounded border-2 transition-all ${formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
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
                        Зберегти
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
