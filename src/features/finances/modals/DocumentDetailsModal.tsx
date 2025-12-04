'use client';

import { Modal } from '@/shared/components/ui/Modal';
import { FinanceDocument } from '../types';

interface DocumentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    document: FinanceDocument | null;
}

export function DocumentDetailsModal({ isOpen, onClose, document }: DocumentDetailsModalProps) {
    if (!document) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Деталі документа" size="md">
                <div className="text-sm text-muted-foreground">Оберіть документ для перегляду.</div>
            </Modal>
        );
    }

    const typeLabels: Record<string, string> = {
        receipt: 'Чек',
        invoice: 'Рахунок',
        expense: 'Видаток',
        income: 'Прихід',
        act: 'Акт',
    };

    const contentTypeLabels: Record<string, string> = {
        services: 'Послуги',
        products: 'Товари',
        mixed: 'Змішане',
    };

    const statusLabels: Record<string, string> = {
        draft: 'Чернетка',
        completed: 'Завершено',
        cancelled: 'Скасовано',
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Деталі документа" size="md">
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Номер</p>
                        <p className="text-sm font-medium text-foreground">{document.number}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Дата</p>
                        <p className="text-sm font-medium text-foreground">
                            {new Date(document.date).toLocaleDateString('uk-UA', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Тип</p>
                        <p className="text-sm font-medium text-foreground">{typeLabels[document.type] ?? document.type}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Вміст</p>
                        <p className="text-sm font-medium text-foreground">{contentTypeLabels[document.contentType] ?? document.contentType}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Сума</p>
                        <p className="text-sm font-semibold text-foreground">₴ {document.amount.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Послуг</p>
                        <p className="text-sm font-medium text-foreground">{document.servicesCount}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Товарів</p>
                        <p className="text-sm font-medium text-foreground">{document.productsCount}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Статус</p>
                        <p className="text-sm font-medium text-foreground">{statusLabels[document.status] ?? document.status}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Контрагент</p>
                        <p className="text-sm font-medium text-foreground">{document.counterparty}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Автор</p>
                        <p className="text-sm font-medium text-foreground">{document.author}</p>
                    </div>
                </div>

                {document.comment && (
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Коментар</p>
                        <p className="text-sm text-foreground">{document.comment}</p>
                    </div>
                )}
            </div>
        </Modal>
    );
}
