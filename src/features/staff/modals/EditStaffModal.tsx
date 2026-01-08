'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Input } from '@/shared/components/ui/Input';
import { useToast } from '@/shared/hooks/useToast';
import type { AddStaffFormData, StaffRole, StaffGender, Staff } from '../types';

interface EditStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, data: AddStaffFormData) => void;
    staff: Staff | null;
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

export function EditStaffModal({ isOpen, onClose, onSave, staff }: EditStaffModalProps) {
    const toast = useToast();
    const [formData, setFormData] = useState<AddStaffFormData>({
        firstName: '',
        phone: '',
        role: 'master',
        gender: 'female',
        salary: 0,
        commission: 0,
        hireDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        if (staff) {
            setFormData({
                firstName: staff.firstName || '',
                middleName: staff.middleName,
                lastName: staff.lastName,
                phone: staff.phone,
                email: staff.email,
                role: staff.role,
                gender: 'female' as StaffGender,
                salary: staff.salary ?? 0,
                commission: staff.commission ?? 0,
                hireDate: staff.hireDate || '',
                specialization: staff.specialization,
                workSchedule: staff.workSchedule,
            });
        }
    }, [staff]);

    const handleSubmit = () => {
        if (staff) {
            onSave(String(staff.id), formData);
            toast.success("Співробітника оновлено", "Успіх");
            onClose();
        }
    };

    const handleChange = (field: keyof AddStaffFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!staff) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Редагувати співробітника" size="lg">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <Input
                            label="Ім'я"
                            type="text"
                            required
                            value={formData.firstName}
                            onChange={(e) => handleChange('firstName', e.target.value)}
                        />
                    </div>

                    <div className="col-span-2">
                        <Input
                            label="Прізвище"
                            type="text"
                            value={formData.lastName || ''}
                            onChange={(e) => handleChange('lastName', e.target.value)}
                        />
                    </div>

                    <div>
                        <Input
                            label="Телефон"
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="+380"
                        />
                    </div>

                    <div>
                        <Input
                            label="Додатковий телефон"
                            type="tel"
                            value={formData.additionalPhone || ''}
                            onChange={(e) => handleChange('additionalPhone', e.target.value)}
                        />
                    </div>

                    <div className="col-span-2">
                        <Input
                            label="Email"
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => handleChange('email', e.target.value)}
                        />
                    </div>

                    <div>
                        <Dropdown
                            label="Посада"
                            value={formData.role}
                            options={ROLE_OPTIONS}
                            onChange={(val) => handleChange('role', val as StaffRole)}
                        />
                    </div>

                    <div>
                        <Dropdown
                            label="Стать"
                            value={formData.gender}
                            options={GENDER_OPTIONS}
                            onChange={(val) => handleChange('gender', val as StaffGender)}
                        />
                    </div>

                    <div>
                        <Input
                            label="Зарплата (₴)"
                            type="number"
                            required
                            min="0"
                            value={formData.salary}
                            onChange={(e) => handleChange('salary', Number(e.target.value))}
                        />
                    </div>

                    <div>
                        <Input
                            label="Комісія (%)"
                            type="number"
                            required
                            min="0"
                            max="100"
                            value={formData.commission}
                            onChange={(e) => handleChange('commission', Number(e.target.value))}
                        />
                    </div>

                    <div className="col-span-2">
                        <DatePicker
                            label="Дата прийому на роботу"
                            value={formData.hireDate}
                            onChange={(val) => handleChange('hireDate', val)}
                        />
                    </div>

                    <div className="col-span-2">
                        <Input
                            label="Спеціалізація"
                            type="text"
                            value={formData.specialization || ''}
                            onChange={(e) => handleChange('specialization', e.target.value)}
                            placeholder="Наприклад: Стрижка, Фарбування"
                        />
                    </div>

                    <div className="col-span-2">
                        <Input
                            label="Графік роботи"
                            type="text"
                            value={formData.workSchedule || ''}
                            onChange={(e) => handleChange('workSchedule', e.target.value)}
                            placeholder="Наприклад: Пн-Пт 9:00-18:00"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                    >
                        Скасувати
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                    >
                        Зберегти зміни
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
