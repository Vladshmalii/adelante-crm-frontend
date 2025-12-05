'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Switch } from '@/shared/components/ui/Switch';
import { Button } from '@/shared/components/ui/Button';
import type { BonusProgram } from '../types';

interface CreateBonusModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<BonusProgram>) => void;
    bonus?: BonusProgram | null;
}

export function CreateBonusModal({ isOpen, onClose, onSave, bonus }: CreateBonusModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [percentCashback, setPercentCashback] = useState('');
    const [minPurchaseAmount, setMinPurchaseAmount] = useState('');
    const [isActive, setIsActive] = useState(true);

    const isEditing = !!bonus;

    useEffect(() => {
        if (bonus) {
            setName(bonus.name);
            setDescription(bonus.description);
            setPercentCashback(bonus.percentCashback.toString());
            setMinPurchaseAmount(bonus.minPurchaseAmount.toString());
            setIsActive(bonus.isActive);
        } else {
            setName('');
            setDescription('');
            setPercentCashback('');
            setMinPurchaseAmount('0');
            setIsActive(true);
        }
    }, [bonus, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: bonus?.id,
            name,
            description,
            percentCashback: parseFloat(percentCashback) || 0,
            minPurchaseAmount: parseFloat(minPurchaseAmount) || 0,
            isActive,
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Редагувати програму' : 'Нова бонусна програма'}
            size="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                    label="Назва програми"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Введіть назву"
                    required
                />

                <Textarea
                    label="Опис"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Опис бонусної програми"
                    rows={3}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Відсоток кешбеку"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={percentCashback}
                        onChange={(e) => setPercentCashback(e.target.value)}
                        placeholder="0"
                        required
                    />

                    <Input
                        label="Мін. сума покупки (₴)"
                        type="number"
                        min="0"
                        value={minPurchaseAmount}
                        onChange={(e) => setMinPurchaseAmount(e.target.value)}
                        placeholder="0"
                    />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                        <p className="font-medium text-foreground">Активна</p>
                        <p className="text-sm text-muted-foreground">
                            Програма буде доступна для клієнтів
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
