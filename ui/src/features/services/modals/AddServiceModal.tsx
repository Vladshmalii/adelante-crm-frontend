'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Input } from '@/shared/components/ui/Input';
import { SERVICE_CATEGORIES, SERVICE_STATUSES } from '../constants';
import type { AddServiceFormData, ServiceCategory, ServiceStatus } from '../types';
import { staffApi } from '@/lib/api/staff';
import { USE_MOCK_DATA } from '@/lib/config';
import type { Staff } from '@/features/staff/types';

interface AddServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: AddServiceFormData) => void;
}

const COLOR_OPTIONS = [
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#84cc16',
    '#22c55e',
    '#14b8a6',
    '#06b6d4',
    '#3b82f6',
    '#6366f1',
    '#8b5cf6',
    '#a855f7',
    '#ec4899',
];

export function AddServiceModal({ isOpen, onClose, onSave }: AddServiceModalProps) {
    const [formData, setFormData] = useState<AddServiceFormData>({
        name: '',
        category: 'hair',
        duration: 60,
        price: 0,
        status: 'active',
        color: COLOR_OPTIONS[0],
        staff: [],
    });
    const [masters, setMasters] = useState<Staff[]>([]);

    useEffect(() => {
        if (!isOpen || USE_MOCK_DATA) return;
        staffApi
            .getAll({ role: 'master', status: 'active', perPage: 100 })
            .then((page) => setMasters(page.items))
            .catch((err) => console.error('Failed to load masters:', err));
    }, [isOpen]);

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
            staff: [],
        });
    };

    const handleChange = <K extends keyof AddServiceFormData>(
        field: K,
        value: AddServiceFormData[K],
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const toggleMaster = (id: string) => {
        setFormData((prev) => {
            const current = prev.staff || [];
            return {
                ...prev,
                staff: current.includes(id) ? current.filter((m) => m !== id) : [...current, id],
            };
        });
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
                        {COLOR_OPTIONS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => handleChange('color', color)}
                                className={`w-8 h-8 rounded border-2 transition-all ${
                                    formData.color === color
                                        ? 'border-foreground scale-110'
                                        : 'border-transparent'
                                }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                {!USE_MOCK_DATA && (
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Майстри, які виконують послугу
                        </label>
                        {masters.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Немає активних майстрів</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {masters.map((m) => {
                                    const id = String(m.id);
                                    const selected = (formData.staff || []).includes(id);
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => toggleMaster(id)}
                                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                                selected
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'border-border text-foreground hover:border-primary'
                                            }`}
                                        >
                                            {m.firstName} {m.lastName || ''}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

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
