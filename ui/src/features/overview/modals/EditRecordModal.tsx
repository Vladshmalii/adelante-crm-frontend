'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { RECORD_STATUSES, PAYMENT_STATUSES } from '../constants';
import { STAFF_MOCK } from '@/features/staff/data/mockStaff';
import { MOCK_SERVICES } from '@/features/services/data/mockServices';
import { useToast } from '@/shared/hooks/useToast';
import { Record, RecordStatus, PaymentStatus, RecordSource } from '../types';

interface EditRecordFormData {
    employee: string;
    service: string;
    client: string;
    phone: string;
    date: string;
    time: string;
    amount: number;
    status: RecordStatus;
    paymentStatus: PaymentStatus;
    source: RecordSource;
}

interface EditRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Record) => void;
    record: Record | null;
}

export function EditRecordModal({ isOpen, onClose, onSave, record }: EditRecordModalProps) {
    const toast = useToast();

    const [formData, setFormData] = useState<EditRecordFormData>({
        employee: '',
        service: '',
        client: '',
        phone: '',
        date: '',
        time: '',
        amount: 0,
        status: 'pending',
        paymentStatus: 'unpaid',
        source: 'admin',
    });

    useEffect(() => {
        if (record) {
            const dateObj = new Date(record.visitTime);
            setFormData({
                employee: record.employee,
                service: record.service,
                client: record.client,
                phone: record.phone,
                date: dateObj.toISOString().split('T')[0],
                time: dateObj.toTimeString().slice(0, 5),
                amount: record.amount || 0,
                status: record.status,
                paymentStatus: record.paymentStatus,
                source: record.source,
            });
        }
    }, [record]);

    const employees = STAFF_MOCK.map((s) => ({
        value: `${s.firstName} ${s.lastName}`,
        label: `${s.firstName} ${s.lastName}`,
    }));
    const services = MOCK_SERVICES.map((s) => ({ value: s.name, label: s.name }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!record) return;
        onSave({ ...record, ...formData, visitTime: `${formData.date}T${formData.time}:00` });
        toast.success('Запис успішно оновлено', 'Успіх');
        onClose();
    };

    const handleChange = <K extends keyof EditRecordFormData>(
        field: K,
        value: EditRecordFormData[K],
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    if (!record) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Редагувати запис" size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <Input
                            label="Ім'я клієнта"
                            required
                            value={formData.client}
                            onChange={(e) => handleChange('client', e.target.value)}
                        />
                        <Input
                            label="Номер телефону"
                            required
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                        />
                    </div>
                    <div className="p-4 bg-secondary/10 rounded-2xl border border-border/50 space-y-4">
                        <Dropdown
                            label="Статус візиту"
                            value={formData.status}
                            options={RECORD_STATUSES}
                            onChange={(val) => handleChange('status', val as RecordStatus)}
                        />
                        <Dropdown
                            label="Статус оплати"
                            value={formData.paymentStatus}
                            options={PAYMENT_STATUSES}
                            onChange={(val) => handleChange('paymentStatus', val as PaymentStatus)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Dropdown
                        label="Послуга"
                        required
                        value={formData.service}
                        options={services}
                        onChange={(val) => handleChange('service', val as string)}
                    />
                    <Dropdown
                        label="Співробітник"
                        required
                        value={formData.employee}
                        options={employees}
                        onChange={(val) => handleChange('employee', val as string)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        label="Дата візиту"
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => handleChange('date', e.target.value)}
                    />
                    <Input
                        label="Час візиту"
                        type="time"
                        required
                        value={formData.time}
                        onChange={(e) => handleChange('time', e.target.value)}
                    />
                    <Input
                        label="Вартість (₴)"
                        type="number"
                        required
                        value={formData.amount}
                        onChange={(e) => handleChange('amount', Number(e.target.value))}
                    />
                </div>

                <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                    <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest">
                        <span>ID запису: {record.id}</span>
                        <span>Джерело: {formData.source}</span>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-border">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="rounded-xl"
                    >
                        Скасувати
                    </Button>
                    <Button type="submit" variant="primary" className="rounded-xl px-8">
                        Зберегти зміни
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
