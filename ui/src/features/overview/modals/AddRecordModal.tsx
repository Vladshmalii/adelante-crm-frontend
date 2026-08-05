'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { RECORD_SOURCES } from '../constants';
import { STAFF_MOCK } from '@/features/staff/data/mockStaff';
import { MOCK_SERVICES } from '@/features/services/data/mockServices';
import { useToast } from '@/shared/hooks/useToast';
import { Calendar, Clock, User, Phone, Briefcase, CreditCard } from 'lucide-react';

interface AddRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
}

export function AddRecordModal({ isOpen, onClose, onSave }: AddRecordModalProps) {
    const toast = useToast();

    const [formData, setFormData] = useState({
        employee: '',
        service: '',
        client: '',
        phone: '',
        date: '',
        time: '',
        amount: 0,
        source: 'admin',
    });

    const employees = STAFF_MOCK.map((s) => ({
        value: `${s.firstName} ${s.lastName}`,
        label: `${s.firstName} ${s.lastName}`,
    }));
    const services = MOCK_SERVICES.map((s) => ({ value: s.name, label: s.name }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        toast.success('Запис успішно створено', 'Успіх');
        onClose();
    };

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Новий запис" size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                        <Input
                            label="Ім'я клієнта"
                            required
                            placeholder="Введіть ім'я"
                            value={formData.client}
                            onChange={(e) => handleChange('client', e.target.value)}
                        />
                        <Input
                            label="Номер телефону"
                            required
                            placeholder="+380"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                        />
                    </div>
                    <div className="flex items-center justify-center rounded-2xl border border-border/50 bg-secondary/10 p-4">
                        <div className="text-center">
                            <User size={40} className="mx-auto mb-2 text-muted-foreground/30" />
                            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                                Картка клієнта
                            </p>
                            <p className="mt-1 text-[10px] text-muted-foreground/40">
                                Виберіть існуючого або введіть нового
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Dropdown
                        label="Послуга"
                        required
                        value={formData.service}
                        options={services}
                        onChange={(val) => handleChange('service', val)}
                    />
                    <Dropdown
                        label="Співробітник"
                        required
                        value={formData.employee}
                        options={employees}
                        onChange={(val) => handleChange('employee', val)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

                <div className="flex justify-end gap-3 border-t border-border pt-6">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="rounded-xl"
                    >
                        Скасувати
                    </Button>
                    <Button type="submit" variant="primary" className="rounded-xl">
                        Створити запис
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
