'use client';

import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import type { AddClientFormData, ClientCategory, ClientGender, ClientImportance, Client } from '../types';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Input } from '@/shared/components/ui/Input';
import { Checkbox } from '@/shared/components/ui/Checkbox';

interface EditClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, data: AddClientFormData) => void;
    client: Client | null;
}

const CATEGORIES: Array<{ value: ClientCategory; label: string }> = [
    { value: 'vip', label: 'VIP' },
    { value: 'regular', label: 'Звичайний' },
    { value: 'new', label: 'Новий' },
    { value: 'inactive', label: 'Неактивний' },
];

const GENDERS: Array<{ value: ClientGender; label: string }> = [
    { value: 'male', label: 'Чоловіча' },
    { value: 'female', label: 'Жіноча' },
    { value: 'other', label: 'Інша' },
];

const IMPORTANCE_LEVELS: Array<{ value: ClientImportance; label: string }> = [
    { value: 'high', label: 'Висока' },
    { value: 'medium', label: 'Середня' },
    { value: 'low', label: 'Низька' },
];

const COLOR_LABELS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16',
    '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
    '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
];

export function EditClientModal({ isOpen, onClose, onSave, client }: EditClientModalProps) {
    const toast = useToast();
    const [showLastName, setShowLastName] = useState(false);
    const [formData, setFormData] = useState<AddClientFormData>({
        firstName: '',
        phone: '',
        category: 'regular',
        gender: 'female',
        importance: 'medium',
        discount: 0,
        colorLabel: COLOR_LABELS[0],
        noOnlineBooking: false,
        totalSpent: 0,
        totalPaid: 0,
    });

    useEffect(() => {
        if (client) {
            setFormData({
                firstName: client.firstName || '',
                middleName: client.middleName,
                lastName: client.lastName,
                phone: client.phone,
                email: client.email,
                category: 'regular' as ClientCategory,
                gender: 'female' as ClientGender,
                importance: 'medium' as ClientImportance,
                discount: client.discount || 0,
                colorLabel: COLOR_LABELS[0],
                noOnlineBooking: false,
                totalSpent: client.totalSpent,
                totalPaid: client.totalSpent,
            });
            setShowLastName(Boolean(client.lastName));
        }
    }, [client]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (client) {
            onSave(String(client.id), formData);
            toast.success('Клієнта оновлено', 'Успіх');
            onClose();
        }
    };

    const handleChange = (field: keyof AddClientFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const getBirthDate = () => {
        if (formData.birthYear && formData.birthMonth && formData.birthDay) {
            return `${formData.birthYear}-${formData.birthMonth.toString().padStart(2, '0')}-${formData.birthDay.toString().padStart(2, '0')}`;
        }
        return '';
    };

    const handleDateChange = (date: string) => {
        if (!date) {
            setFormData(prev => ({ ...prev, birthYear: undefined, birthMonth: undefined, birthDay: undefined }));
            return;
        }
        const [year, month, day] = date.split('-');
        setFormData(prev => ({
            ...prev,
            birthYear: year,
            birthMonth: parseInt(month).toString(),
            birthDay: parseInt(day).toString()
        }));
    };

    if (!client) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Редагувати клієнта" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
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

                    {!showLastName && (
                        <div className="col-span-2">
                            <button
                                type="button"
                                onClick={() => setShowLastName(true)}
                                className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                                <Plus size={16} />
                                Додати прізвище?
                            </button>
                        </div>
                    )}

                    {showLastName && (
                        <div className="col-span-2">
                            <Input
                                label="Прізвище"
                                type="text"
                                value={formData.lastName || ''}
                                onChange={(e) => handleChange('lastName', e.target.value)}
                            />
                        </div>
                    )}

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
                            label="Категория"
                            value={formData.category}
                            options={CATEGORIES}
                            onChange={(val) => handleChange('category', val)}
                        />
                    </div>

                    <div>
                        <Dropdown
                            label="Стать"
                            value={formData.gender}
                            options={GENDERS}
                            onChange={(val) => handleChange('gender', val)}
                        />
                    </div>

                    <div>
                        <Dropdown
                            label="Важливість"
                            value={formData.importance}
                            options={IMPORTANCE_LEVELS}
                            onChange={(val) => handleChange('importance', val)}
                        />
                    </div>

                    <div>
                        <Input
                            label="Знижка (%)"
                            type="number"
                            min="0"
                            max="100"
                            value={formData.discount}
                            onChange={(e) => handleChange('discount', Number(e.target.value))}
                        />
                    </div>

                    <div className="col-span-2">
                        <Input
                            label="Номер картки"
                            type="text"
                            value={formData.cardNumber || ''}
                            onChange={(e) => handleChange('cardNumber', e.target.value)}
                        />
                    </div>

                    <div className="col-span-2">
                        <DatePicker
                            label="Дата народження"
                            value={getBirthDate()}
                            onChange={handleDateChange}
                            placeholder="Оберіть дату"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Кольорова мітка
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {COLOR_LABELS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => handleChange('colorLabel', color)}
                                    className={`w-8 h-8 rounded border-2 transition-all ${formData.colorLabel === color ? 'border-foreground scale-110' : 'border-transparent'
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="col-span-2">
                        <Checkbox
                            label="Заборонити записуватись онлайн"
                            checked={formData.noOnlineBooking}
                            onChange={(e) => handleChange('noOnlineBooking', e.target.checked)}
                        />
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
                        Зберегти зміни
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
