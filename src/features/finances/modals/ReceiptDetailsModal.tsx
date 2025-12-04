'use client';

import { Modal } from '@/shared/components/ui/Modal';
import { FinanceReceipt } from '../types';

interface ReceiptDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    receipt: FinanceReceipt | null;
}

export function ReceiptDetailsModal({ isOpen, onClose, receipt }: ReceiptDetailsModalProps) {
    if (!receipt) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Деталі чеку" size="md">
                <div className="text-sm text-muted-foreground">Оберіть чек для перегляду.</div>
            </Modal>
        );
    }

    const statusLabels: Record<string, string> = {
        paid: 'Оплачено',
        cancelled: 'Скасовано',
        partial: 'Часткова оплата',
    };

    const sourceLabels: Record<string, string> = {
        web: 'Веб',
        mobile: 'Мобільний застосунок',
        pos: 'POS-термінал',
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Деталі чеку" size="md">
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Номер чеку</p>
                        <p className="text-sm font-medium text-foreground">{receipt.receiptNumber}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Дата і час</p>
                        <p className="text-sm font-medium text-foreground">
                            {new Date(receipt.date).toLocaleString('uk-UA', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">№ документа</p>
                        <p className="text-sm font-medium text-foreground">{receipt.documentNumber}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Каса</p>
                        <p className="text-sm font-medium text-foreground">{receipt.cashRegister}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Клієнт</p>
                        <p className="text-sm font-medium text-foreground">{receipt.client}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Сума</p>
                        <p className="text-sm font-semibold text-foreground">₴ {receipt.amount.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Метод оплати</p>
                        <p className="text-sm font-medium text-foreground">{receipt.paymentMethod}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Статус</p>
                        <p className="text-sm font-medium text-foreground">{statusLabels[receipt.status] ?? receipt.status}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Залишок у касі</p>
                        <p className="text-sm font-medium text-foreground">₴ {receipt.balanceAfter.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Джерело</p>
                        <p className="text-sm font-medium text-foreground">{sourceLabels[receipt.source] ?? receipt.source}</p>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
