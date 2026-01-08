'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Textarea } from '@/shared/components/ui/Textarea';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import type { DocumentType, DocumentContentType, DocumentStatus, FinanceDocument } from '../types';

interface CreateDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<FinanceDocument, 'id'>) => Promise<void>;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
    { value: 'receipt', label: 'Чек' },
    { value: 'invoice', label: 'Рахунок' },
    { value: 'expense', label: 'Видаток' },
    { value: 'income', label: 'Прихід' },
    { value: 'act', label: 'Акт' },
];

const CONTENT_TYPES: { value: DocumentContentType; label: string }[] = [
    { value: 'services', label: 'Послуги' },
    { value: 'products', label: 'Товари' },
    { value: 'mixed', label: 'Змішане' },
];

const DOCUMENT_STATUSES: { value: DocumentStatus; label: string }[] = [
    { value: 'draft', label: 'Чернетка' },
    { value: 'issued', label: 'Виписано' },
    { value: 'paid', label: 'Оплачено' },
    { value: 'cancelled', label: 'Скасовано' },
];

export function CreateDocumentModal({ isOpen, onClose, onSave }: CreateDocumentModalProps) {
    const [formData, setFormData] = useState<Omit<FinanceDocument, 'id'>>({
        number: '',
        date: new Date().toISOString().split('T')[0],
        type: 'invoice',
        contentType: 'services',
        amount: 0,
        servicesCount: 0,
        productsCount: 0,
        counterparty: '',
        comment: '',
        author: 'Адміністратор',
        status: 'draft',
    });

    const handleChange = <K extends keyof Omit<FinanceDocument, 'id'>>(field: K, value: Omit<FinanceDocument, 'id'>[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Створити документ" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Номер документа"
                        type="text"
                        required
                        value={formData.number}
                        onChange={(e) => handleChange('number', e.target.value)}
                    />
                    <DatePicker
                        label="Дата"
                        value={formData.date}
                        onChange={(val) => handleChange('date', val)}
                    />
                    <Dropdown
                        label="Тип документа"
                        value={formData.type}
                        options={DOCUMENT_TYPES}
                        onChange={(val) => handleChange('type', val as DocumentType)}
                    />
                    <Dropdown
                        label="Вміст"
                        value={formData.contentType}
                        options={CONTENT_TYPES}
                        onChange={(val) => handleChange('contentType', val as DocumentContentType)}
                    />
                </div>

                <Input
                    label="Контрагент"
                    type="text"
                    required
                    value={formData.counterparty}
                    onChange={(e) => handleChange('counterparty', e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                        label="Сума (₴)"
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => handleChange('amount', Number(e.target.value))}
                    />
                    <Input
                        label="Послуг"
                        type="number"
                        min="0"
                        value={formData.servicesCount}
                        onChange={(e) => handleChange('servicesCount', Number(e.target.value))}
                    />
                    <Input
                        label="Товарів"
                        type="number"
                        min="0"
                        value={formData.productsCount}
                        onChange={(e) => handleChange('productsCount', Number(e.target.value))}
                    />
                </div>

                <Dropdown
                    label="Статус"
                    value={formData.status}
                    options={DOCUMENT_STATUSES}
                    onChange={(val) => handleChange('status', val as DocumentStatus)}
                />

                <Textarea
                    label="Коментар"
                    value={formData.comment || ''}
                    onChange={(e) => handleChange('comment', e.target.value)}
                    placeholder="Додаткова інформація..."
                    rows={3}
                />

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
                        Створити
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
