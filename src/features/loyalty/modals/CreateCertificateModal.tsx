'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/Input';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Button } from '@/shared/components/ui/Button';
import { CERTIFICATE_AMOUNTS } from '../constants';
import type { Certificate } from '../types';

interface CreateCertificateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Certificate>) => void;
}

export function CreateCertificateModal({ isOpen, onClose, onSave }: CreateCertificateModalProps) {
    const [amount, setAmount] = useState('1000');
    const [customAmount, setCustomAmount] = useState('');
    const [purchasedBy, setPurchasedBy] = useState('');
    const [purchasedFor, setPurchasedFor] = useState('');
    const [validityMonths, setValidityMonths] = useState('12');

    const validityOptions = [
        { value: '3', label: '3 місяці' },
        { value: '6', label: '6 місяців' },
        { value: '12', label: '1 рік' },
        { value: '24', label: '2 роки' },
    ];

    const amountOptions = [
        ...CERTIFICATE_AMOUNTS,
        { value: 'custom', label: 'Інша сума' },
    ];

    const generateCode = () => {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `CERT-${year}-${random}`;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const finalAmount = amount === 'custom'
            ? parseFloat(customAmount) || 0
            : parseFloat(amount);

        const validUntil = new Date();
        validUntil.setMonth(validUntil.getMonth() + parseInt(validityMonths));

        onSave({
            code: generateCode(),
            amount: finalAmount,
            balance: finalAmount,
            purchasedBy: purchasedBy || undefined,
            purchasedFor: purchasedFor || undefined,
            purchasedAt: new Date().toISOString().split('T')[0],
            validUntil: validUntil.toISOString().split('T')[0],
            isUsed: false,
        });
    };

    const handleClose = () => {
        setAmount('1000');
        setCustomAmount('');
        setPurchasedBy('');
        setPurchasedFor('');
        setValidityMonths('12');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Новий сертифікат"
            size="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-foreground">
                        Номінал
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {CERTIFICATE_AMOUNTS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setAmount(opt.value.toString())}
                                className={`p-3 text-center rounded-lg border transition-all ${amount === opt.value.toString()
                                        ? 'border-primary bg-primary/10 text-primary font-medium'
                                        : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => setAmount('custom')}
                        className={`w-full p-3 text-center rounded-lg border transition-all ${amount === 'custom'
                                ? 'border-primary bg-primary/10 text-primary font-medium'
                                : 'border-border hover:border-primary/50'
                            }`}
                    >
                        Інша сума
                    </button>
                    {amount === 'custom' && (
                        <Input
                            type="number"
                            min="100"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            placeholder="Введіть суму"
                            required
                        />
                    )}
                </div>

                <Dropdown
                    label="Термін дії"
                    value={validityMonths}
                    options={validityOptions}
                    onChange={(val) => setValidityMonths(val as string)}
                />

                <Input
                    label="Від кого (опціонально)"
                    value={purchasedBy}
                    onChange={(e) => setPurchasedBy(e.target.value)}
                    placeholder="Імʼя покупця"
                />

                <Input
                    label="Для кого (опціонально)"
                    value={purchasedFor}
                    onChange={(e) => setPurchasedFor(e.target.value)}
                    placeholder="Імʼя отримувача"
                />

                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Номінал:</span>
                        <span className="font-medium">
                            {amount === 'custom' ? customAmount || '0' : amount} ₴
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Дійсний до:</span>
                        <span className="font-medium">
                            {new Date(
                                new Date().setMonth(
                                    new Date().getMonth() + parseInt(validityMonths)
                                )
                            ).toLocaleDateString('uk-UA')}
                        </span>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button variant="secondary" type="button" onClick={handleClose}>
                        Скасувати
                    </Button>
                    <Button type="submit">
                        Створити
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
