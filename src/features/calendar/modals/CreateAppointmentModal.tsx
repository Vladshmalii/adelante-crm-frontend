'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { TimePicker } from '@/shared/components/ui/TimePicker';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Card } from '../components/ui/Card';
import { Radio, RadioGroup } from '@/shared/components/ui/Radio';
import { useToast } from '@/shared/hooks/useToast';

import { StaffMember, AppointmentType } from '../types';

interface CreateAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateAppointmentData) => void;
    staff: StaffMember[];
    initialStaffId?: string;
    initialTime?: string;
    initialDate?: string;
}

export interface CreateAppointmentData {
    staffId: string;
    clientName: string;
    clientPhone: string;
    service: string;
    startTime: string;
    endTime: string;
    date: string;
    type: AppointmentType;
    notes: string;
    price: number;
}

const APPOINTMENT_TYPES: { value: AppointmentType; label: string }[] = [
    { value: 'standard', label: 'Стандартний' },
    { value: 'important', label: 'Важливий' },
    { value: 'special', label: 'Особливий' },
];

export function CreateAppointmentModal({
    isOpen,
    onClose,
    onSave,
    staff,
    initialStaffId,
    initialTime,
    initialDate,
}: CreateAppointmentModalProps) {
    const toast = useToast();

    const addMinutes = (time: string, minutes: number) => {
        const [h, m] = time.split(':').map(Number);
        const total = h * 60 + m + minutes;
        const hh = Math.floor(total / 60).toString().padStart(2, '0');
        const mm = (total % 60).toString().padStart(2, '0');
        return `${hh}:${mm}`;
    };

    const buildInitialFormData = (): CreateAppointmentData => {
        const baseStaffId = initialStaffId || staff[0]?.id || '';
        const baseStart = initialTime || '10:00';
        const baseEnd = addMinutes(baseStart, 30);

        return {
            staffId: baseStaffId,
            clientName: '',
            clientPhone: '',
            service: '',
            startTime: baseStart,
            endTime: baseEnd,
            date: initialDate || new Date().toISOString().split('T')[0],
            type: 'standard',
            notes: '',
            price: 0,
        };
    };

    const [formData, setFormData] = useState<CreateAppointmentData>(buildInitialFormData);

    useEffect(() => {
        if (isOpen) {
            setFormData(buildInitialFormData());
        }
    }, [isOpen, initialTime, initialDate, initialStaffId, staff.length]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
        setFormData(buildInitialFormData());
        toast.success('Запис створено', 'Успіх');
    };

    const handleChange = (field: keyof CreateAppointmentData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleStartTimeChange = (time: string) => {
        setFormData(prev => {
            const next = { ...prev, startTime: time };

            const [sh, sm] = time.split(':').map(Number);
            const [eh, em] = prev.endTime.split(':').map(Number);
            const startTotal = sh * 60 + sm;
            const endTotal = eh * 60 + em;

            if (endTotal <= startTotal) {
                next.endTime = addMinutes(time, 30);
            }

            return next;
        });
    };

    const handleEndTimeChange = (time: string) => {
        setFormData(prev => {
            const [sh, sm] = prev.startTime.split(':').map(Number);
            const [eh, em] = time.split(':').map(Number);
            const startTotal = sh * 60 + sm;
            const endTotal = eh * 60 + em;

            if (endTotal <= startTotal) {
                return { ...prev, endTime: addMinutes(prev.startTime, 15) };
            }

            return { ...prev, endTime: time };
        });
    };

    const staffOptions = staff.map(s => ({
        value: s.id,
        label: `${s.name} — ${s.role}`
    }));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Створити запис" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Dropdown
                            label="Майстер"
                            value={formData.staffId}
                            options={staffOptions}
                            onChange={(val) => handleChange('staffId', val)}
                            searchable
                        />
                    </div>

                    <div>
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
                            onChange={handleStartTimeChange}
                        />
                    </div>

                    <div>
                        <TimePicker
                            label="Час закінчення"
                            value={formData.endTime}
                            onChange={handleEndTimeChange}
                        />
                    </div>

                    <div>
                        <Input
                            label="Ім'я клієнта"
                            type="text"
                            required
                            value={formData.clientName}
                            onChange={(e) => handleChange('clientName', e.target.value)}
                            placeholder="Введіть ім'я"
                        />
                    </div>

                    <div>
                        <Input
                            label="Телефон"
                            type="tel"
                            value={formData.clientPhone}
                            onChange={(e) => handleChange('clientPhone', e.target.value)}
                            placeholder="+380 XX XXX XXXX"
                        />
                    </div>

                    <div className="col-span-2">
                        <Input
                            label="Послуга"
                            type="text"
                            required
                            value={formData.service}
                            onChange={(e) => handleChange('service', e.target.value)}
                            placeholder="Назва послуги"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-3">Тип запису</label>
                        <RadioGroup orientation="horizontal">
                            {APPOINTMENT_TYPES.map((type) => (
                                <Radio
                                    key={type.value}
                                    name="appointment-type"
                                    value={type.value}
                                    checked={formData.type === type.value}
                                    onChange={() => handleChange('type', type.value)}
                                    label={type.label}
                                />
                            ))}
                        </RadioGroup>
                    </div>

                    <div>
                        <Input
                            label="Ціна (грн)"
                            type="number"
                            value={formData.price}
                            onChange={(e) => handleChange('price', Number(e.target.value))}
                            placeholder="0"
                            min="0"
                        />
                    </div>

                    <div className="col-span-2">
                        <Textarea
                            label="Коментар"
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Додаткова інформація..."
                            rows={3}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Скасувати
                    </Button>
                    <Button type="submit" variant="primary">
                        Створити запис
                    </Button>
                </div>
            </form>
        </Modal>
    );
}