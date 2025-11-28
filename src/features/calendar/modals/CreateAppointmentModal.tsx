'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { StaffMember, AppointmentType } from '../types';
import clsx from 'clsx';

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
    const [formData, setFormData] = useState<CreateAppointmentData>({
        staffId: initialStaffId || staff[0]?.id || '',
        clientName: '',
        clientPhone: '',
        service: '',
        startTime: initialTime || '10:00',
        endTime: '11:00',
        date: initialDate || new Date().toISOString().split('T')[0],
        type: 'standard',
        notes: '',
        price: 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
        // Reset form
        setFormData({
            staffId: initialStaffId || staff[0]?.id || '',
            clientName: '',
            clientPhone: '',
            service: '',
            startTime: initialTime || '10:00',
            endTime: '11:00',
            date: initialDate || new Date().toISOString().split('T')[0],
            type: 'standard',
            notes: '',
            price: 0,
        });
    };

    const handleChange = (field: keyof CreateAppointmentData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const staffOptions = staff.map(s => ({
        value: s.id,
        label: `${s.name} — ${s.role}`
    }));

    const inputClasses = "w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all shadow-sm hover:border-primary/50";
    const labelClasses = "block text-sm font-medium text-foreground mb-1";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Створити запис" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {/* Staff */}
                    <div>
                        <Dropdown
                            label="Майстер *"
                            value={formData.staffId}
                            options={staffOptions}
                            onChange={(val) => handleChange('staffId', val)}
                            searchable
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <DatePicker
                            label="Дата *"
                            value={formData.date}
                            onChange={(val) => handleChange('date', val)}
                        />
                    </div>

                    {/* Start Time */}
                    <div>
                        <label className={labelClasses}>
                            Час початку *
                        </label>
                        <input
                            type="time"
                            value={formData.startTime}
                            onChange={(e) => handleChange('startTime', e.target.value)}
                            className={inputClasses}
                            required
                        />
                    </div>

                    {/* End Time */}
                    <div>
                        <label className={labelClasses}>
                            Час закінчення *
                        </label>
                        <input
                            type="time"
                            value={formData.endTime}
                            onChange={(e) => handleChange('endTime', e.target.value)}
                            className={inputClasses}
                            required
                        />
                    </div>

                    {/* Client Name */}
                    <div>
                        <label className={labelClasses}>
                            Ім'я клієнта *
                        </label>
                        <input
                            type="text"
                            value={formData.clientName}
                            onChange={(e) => handleChange('clientName', e.target.value)}
                            className={inputClasses}
                            placeholder="Введіть ім'я"
                            required
                        />
                    </div>

                    {/* Client Phone */}
                    <div>
                        <label className={labelClasses}>
                            Телефон
                        </label>
                        <input
                            type="tel"
                            value={formData.clientPhone}
                            onChange={(e) => handleChange('clientPhone', e.target.value)}
                            className={inputClasses}
                            placeholder="+380 XX XXX XXXX"
                        />
                    </div>

                    {/* Service */}
                    <div className="col-span-2">
                        <label className={labelClasses}>
                            Послуга *
                        </label>
                        <input
                            type="text"
                            value={formData.service}
                            onChange={(e) => handleChange('service', e.target.value)}
                            className={inputClasses}
                            placeholder="Назва послуги"
                            required
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <Dropdown
                            label="Тип запису"
                            value={formData.type}
                            options={APPOINTMENT_TYPES}
                            onChange={(val) => handleChange('type', val)}
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label className={labelClasses}>
                            Ціна (грн)
                        </label>
                        <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => handleChange('price', Number(e.target.value))}
                            className={inputClasses}
                            placeholder="0"
                            min="0"
                        />
                    </div>

                    {/* Notes */}
                    <div className="col-span-2">
                        <label className={labelClasses}>
                            Коментар
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            className={clsx(inputClasses, "resize-none")}
                            placeholder="Додаткова інформація..."
                            rows={3}
                        />
                    </div>
                </div>

                {/* Actions */}
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