'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/Input';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Switch } from '@/shared/components/ui/Switch';
import { Button } from '@/shared/components/ui/Button';
import { DISCOUNT_TYPES, APPLICABLE_TO_OPTIONS } from '../constants';
import type { Discount } from '../types';

interface CreateDiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Discount>) => void;
    discount?: Discount | null;
}

export function CreateDiscountModal({ isOpen, onClose, onSave, discount }: CreateDiscountModalProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
    const [value, setValue] = useState('');
    const [code, setCode] = useState('');
    const [minOrderAmount, setMinOrderAmount] = useState('');
    const [maxUses, setMaxUses] = useState('');
    const [validFrom, setValidFrom] = useState('');
    const [validTo, setValidTo] = useState('');
    const [applicableTo, setApplicableTo] = useState<'all' | 'services' | 'products'>('all');
    const [isActive, setIsActive] = useState(true);

    const isEditing = !!discount;

    useEffect(() => {
        if (discount) {
            setName(discount.name);
            setType(discount.type);
            setValue(discount.value.toString());
            setCode(discount.code || '');
            setMinOrderAmount(discount.minOrderAmount?.toString() || '');
            setMaxUses(discount.maxUses?.toString() || '');
            setValidFrom(discount.validFrom);
            setValidTo(discount.validTo);
            setApplicableTo(discount.applicableTo);
            setIsActive(discount.isActive);
        } else {
            const today = new Date().toISOString().split('T')[0];
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);

            setName('');
            setType('percentage');
            setValue('');
            setCode('');
            setMinOrderAmount('');
            setMaxUses('');
            setValidFrom(today);
            setValidTo(nextYear.toISOString().split('T')[0]);
            setApplicableTo('all');
            setIsActive(true);
        }
    }, [discount, isOpen]);

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCode(result);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: discount?.id,
            name,
            type,
            value: parseFloat(value) || 0,
            code: code || undefined,
            minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : undefined,
            maxUses: maxUses ? parseInt(maxUses) : undefined,
            currentUses: discount?.currentUses || 0,
            validFrom,
            validTo,
            applicableTo,
            isActive,
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Редагувати знижку' : 'Нова знижка'}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                    label="Назва знижки"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Введіть назву"
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Dropdown
                        label="Тип знижки"
                        value={type}
                        options={DISCOUNT_TYPES}
                        onChange={(val) => setType(val as 'percentage' | 'fixed')}
                    />

                    <Input
                        label={type === 'percentage' ? 'Відсоток (%)' : 'Сума (₴)'}
                        type="number"
                        min="0"
                        max={type === 'percentage' ? '100' : undefined}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="0"
                        required
                    />
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <Input
                            label="Промокод"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="PROMO2025"
                        />
                    </div>
                    <div className="flex items-end">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={generateCode}
                        >
                            Згенерувати
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Мін. сума замовлення (₴)"
                        type="number"
                        min="0"
                        value={minOrderAmount}
                        onChange={(e) => setMinOrderAmount(e.target.value)}
                        placeholder="Без обмежень"
                    />

                    <Input
                        label="Макс. кількість використань"
                        type="number"
                        min="0"
                        value={maxUses}
                        onChange={(e) => setMaxUses(e.target.value)}
                        placeholder="Без обмежень"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <DatePicker
                        label="Дійсна з"
                        value={validFrom}
                        onChange={setValidFrom}
                    />
                    <DatePicker
                        label="Дійсна до"
                        value={validTo}
                        onChange={setValidTo}
                    />
                </div>

                <Dropdown
                    label="Застосовується до"
                    value={applicableTo}
                    options={APPLICABLE_TO_OPTIONS}
                    onChange={(val) => setApplicableTo(val as 'all' | 'services' | 'products')}
                />

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                        <p className="font-medium text-foreground">Активна</p>
                        <p className="text-sm text-muted-foreground">
                            Знижка буде доступна для застосування
                        </p>
                    </div>
                    <Switch
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Скасувати
                    </Button>
                    <Button type="submit">
                        {isEditing ? 'Зберегти' : 'Створити'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
