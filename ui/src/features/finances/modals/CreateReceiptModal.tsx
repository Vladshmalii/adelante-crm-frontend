'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import type { ReceiptSource } from '../types';
import type { CreateReceiptPayload } from '@/lib/api/finances';

interface CreateReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateReceiptPayload) => void | Promise<void>;
}

const RECEIPT_SOURCES: { value: ReceiptSource; label: string }[] = [
    { value: 'web', label: 'Веб' },
    { value: 'mobile', label: 'Мобільний застосунок' },
    { value: 'pos', label: 'POS-термінал' },
];

export function CreateReceiptModal({ isOpen, onClose, onSave }: CreateReceiptModalProps) {
    const { methods } = usePaymentMethods();
    const [clientName, setClientName] = useState('');
    const [amount, setAmount] = useState(0);
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [source, setSource] = useState<ReceiptSource>('web');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentMethodId) return;
        await onSave({
            clientName: clientName || undefined,
            payments: [{ paymentMethodId, amount }],
            source,
            date: `${date}T00:00:00.000Z`,
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Створити чек (ручний продаж)" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Клієнт"
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ім'я клієнта (необов'язково)"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DatePicker label="Дата" value={date} onChange={setDate} />
                    <Dropdown
                        label="Джерело"
                        value={source}
                        options={RECEIPT_SOURCES}
                        onChange={(val) => setSource(val as ReceiptSource)}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Сума (₴)"
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                    />
                    <Dropdown
                        label="Метод оплати"
                        value={paymentMethodId}
                        options={methods.map((m) => ({
                            value: m.id.toString(),
                            label: m.name || '',
                        }))}
                        onChange={setPaymentMethodId}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Скасувати
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={!paymentMethodId || amount <= 0}
                    >
                        Створити
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
