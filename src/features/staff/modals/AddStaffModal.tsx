'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import type { AddStaffFormData, StaffRole, StaffGender } from '../types';

interface AddStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: AddStaffFormData) => void;
}

const ROLE_OPTIONS = [
    { value: 'master', label: 'Майстер' },
    { value: 'administrator', label: 'Адміністратор' },
    { value: 'manager', label: 'Менеджер' },
];

const GENDER_OPTIONS = [
    { value: 'female', label: 'Жінка' },
    { value: 'male', label: 'Чоловік' },
    { value: 'other', label: 'Інше' },
];

export function AddStaffModal({ isOpen, onClose, onSave }: AddStaffModalProps) {
    const [formData, setFormData] = useState<AddStaffFormData>({
        firstName: '',
        lastName: '',
        phone: '',
        additionalPhone: '',
        email: '',
        role: 'master',
        gender: 'female',
        salary: 0,
        commission: 0,
        hireDate: '',
        specialization: '',
        workSchedule: '',
        colorLabel: '',
    });

    const handleSubmit = () => {
        onSave(formData);
        onClose();
        // Reset form
        setFormData({
            firstName: '',
            lastName: '',
            phone: '',
            additionalPhone: '',
            email: '',
            role: 'master',
            gender: 'female',
            salary: 0,
            commission: 0,
            hireDate: '',
            specialization: '',
            workSchedule: '',
            colorLabel: '',
        });
    };

    const handleChange = (field: keyof AddStaffFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Додати співробітника">
            <div className="space-y-4">
                {/* Основна інформація */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                        Особиста інформація
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Ім'я *
                            </label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => handleChange('firstName', e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Введіть ім'я"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Прізвище
                            </label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => handleChange('lastName', e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Введіть прізвище"
                            />
                        </div>
                    </div>

                    <Dropdown
                        label="Стать"
                        value={formData.gender}
                        onChange={(value) => handleChange('gender', value as StaffGender)}
                        options={GENDER_OPTIONS}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Телефон *
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="+380"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Додатковий телефон
                            </label>
                            <input
                                type="tel"
                                value={formData.additionalPhone}
                                onChange={(e) => handleChange('additionalPhone', e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="+380"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="example@salon.ua"
                        />
                    </div>
                </div>

                {/* Робоча інформація */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                        Робоча інформація
                    </h3>

                    <Dropdown
                        label="Посада *"
                        value={formData.role}
                        onChange={(value) => handleChange('role', value as StaffRole)}
                        options={ROLE_OPTIONS}
                    />

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Спеціалізація
                        </label>
                        <input
                            type="text"
                            value={formData.specialization}
                            onChange={(e) => handleChange('specialization', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Наприклад: Перукар-стиліст"
                        />
                    </div>

                    <DatePicker
                        label="Дата прийому на роботу *"
                        value={formData.hireDate}
                        onChange={(value) => handleChange('hireDate', value)}
                    />

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Робочий графік
                        </label>
                        <input
                            type="text"
                            value={formData.workSchedule}
                            onChange={(e) => handleChange('workSchedule', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Наприклад: Пн-Пт 9:00-18:00"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Зарплата (₴) *
                            </label>
                            <input
                                type="number"
                                value={formData.salary || ''}
                                onChange={(e) => handleChange('salary', Number(e.target.value))}
                                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="15000"
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Комісія (%)
                            </label>
                            <input
                                type="number"
                                value={formData.commission || ''}
                                onChange={(e) => handleChange('commission', Number(e.target.value))}
                                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="30"
                                min="0"
                                max="100"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
                <Button variant="secondary" onClick={onClose}>
                    Скасувати
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={!formData.firstName || !formData.phone || !formData.hireDate}
                >
                    Зберегти
                </Button>
            </div>
        </Modal>
    );
}
