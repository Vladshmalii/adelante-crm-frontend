'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Input } from '@/shared/components/ui/Input';
import { SERVICE_CATEGORIES, SERVICE_STATUSES } from '../constants';
import type { AddServiceFormData, ServiceCategory, ServiceStatus, Service } from '../types';

interface EditServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, data: AddServiceFormData) => void;
    onDelete: () => void;
    service: Service | null;
}

const COLOR_OPTIONS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16',
    '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
    '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
];

export function EditServiceModal({ isOpen, onClose, onSave, onDelete, service }: EditServiceModalProps) {
    const [formData, setFormData] = useState<AddServiceFormData>({
        name: '',
        category: 'hair',
        duration: 60,
        price: 0,
        status: 'active',
        color: COLOR_OPTIONS[0],
    });

    useEffect(() => {
        if (service) {
            setFormData({
                name: service.name,
                category: service.category as ServiceCategory,
                description: service.description,
                duration: service.duration,
                price: service.price,
                status: (service.status as ServiceStatus) || 'active',
                color: service.color || COLOR_OPTIONS[0],
            });
        }
    }, [service]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (service) {
            onSave(String(service.id), formData);
            onClose();
        }
    };

    const handleChange = (field: keyof AddServiceFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!service) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Редагувати послугу" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Назва послуги"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
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

                <div className="flex justify-between gap-3 pt-4 border-t border-border">
                    <Button
                        type="button"
                        variant="danger"
                        onClick={onDelete}
                    >
                        Видалити
                    </Button>
                    <div className="flex gap-3">
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
                </div>
            </form>
        </Modal>
    );
}
