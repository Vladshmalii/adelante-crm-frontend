'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { TimePicker } from '@/shared/components/ui/TimePicker';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Input } from '@/shared/components/ui/Input';
import { Appointment, StaffMember, AppointmentType, AppointmentStatus } from '../types';

interface EditAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, data: Partial<Appointment>) => void;
    onDelete: () => void;
    appointment: Appointment | null;
    staff: StaffMember[];
}

const APPOINTMENT_TYPES: { value: AppointmentType; label: string }[] = [
    { value: 'standard', label: 'Стандартний' },
    { value: 'important', label: 'Важливий' },
    { value: 'special', label: 'Особливий' },
];

const APPOINTMENT_STATUSES: { value: AppointmentStatus; label: string }[] = [
    { value: 'scheduled', label: 'Записано' },
    { value: 'confirmed', label: 'Підтверджено' },
    { value: 'arrived', label: 'Прийшов' },
    { value: 'no-show', label: 'Не прийшов' },
    { value: 'cancelled', label: 'Відміна' },
    { value: 'completed', label: 'Завершено' },
    { value: 'paid', label: 'Оплачено' },
];

export function EditAppointmentModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    appointment,
    staff,
}: EditAppointmentModalProps) {
    const toast = useToast();
    const [formData, setFormData] = useState({
        staffId: '',
        clientName: '',
        clientPhone: '',
        service: '',
        startTime: '',
        endTime: '',
        date: '',
        type: 'standard' as AppointmentType,
        status: 'scheduled' as AppointmentStatus,
        notes: '',
        price: 0,
    });

    useEffect(() => {
        if (appointment) {
            setFormData({
                staffId: appointment.staffId,
                clientName: appointment.clientName,
                clientPhone: appointment.clientPhone || '',
                service: appointment.service,
                startTime: appointment.startTime,
                endTime: appointment.endTime,
                date: appointment.date,
                type: appointment.type,
                status: appointment.status,
                notes: appointment.notes || '',
                price: appointment.price || 0,
            });
        }
    }, [appointment]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (appointment) {
            onSave(appointment.id, formData);
            toast.success('Запис оновлено', 'Успіх');
            onClose();
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!appointment) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Редагувати запис" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <Dropdown
                            label="Майстер"
                            value={formData.staffId}
                            options={staff.map(s => ({ value: s.id, label: s.name }))}
                            onChange={(val) => handleChange('staffId', val)}
                        />
                    </div>

                    <div className="col-span-2">
                        <Input
                            label="Ім'я клієнта"
                            type="text"
                            required
                            value={formData.clientName}
                            onChange={(e) => handleChange('clientName', e.target.value)}
                        />
                    </div>

                    <div className="col-span-2">
                        <Input
                            label="Телефон"
                            type="tel"
                            value={formData.clientPhone}
                            onChange={(e) => handleChange('clientPhone', e.target.value)}
                            placeholder="+380"
                        />
                    </div>

                    <div className="col-span-2">
                        <Input
                            label="Послуга"
                            type="text"
                            required
                            value={formData.service}
                            onChange={(e) => handleChange('service', e.target.value)}
                        />
                    </div>

                    <div className="col-span-2">
                        <DatePicker
                            label="Дата"
                            value={formData.date}
                            onChange={(val) => handleChange('date', val)}
                        />
                    </div>

                    <div>
                        <TimePicker
                            label="Час початку"
                            value={formData.startTime}
                            onChange={(time) => handleChange('startTime', time)}
                        />
                    </div>

                    <div>
                        <TimePicker
                            label="Час закінчення"
                            value={formData.endTime}
                            onChange={(time) => handleChange('endTime', time)}
                        />
                    </div>

                    <div>
                        <Dropdown
                            label="Тип"
                            value={formData.type}
                            options={APPOINTMENT_TYPES}
                            onChange={(val) => handleChange('type', val)}
                        />
                    </div>

                    <div>
                        <Dropdown
                            label="Статус"
                            value={formData.status}
                            options={APPOINTMENT_STATUSES}
                            onChange={(val) => handleChange('status', val)}
                        />
                    </div>

                    <div className="col-span-2">
                        <Input
                            label="Ціна (₴)"
                            type="number"
                            min="0"
                            value={formData.price}
                            onChange={(e) => handleChange('price', Number(e.target.value))}
                        />
                    </div>

                    <div className="col-span-2">
                        <Textarea
                            label="Нотатки"
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Додаткова інформація..."
                            rows={3}
                        />
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
