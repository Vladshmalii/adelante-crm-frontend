'use client';

import { Modal } from '@/shared/components/ui/Modal';
import { FinanceOperation } from '../types';

interface OperationDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    operation: FinanceOperation | null;
}

export function OperationDetailsModal({ isOpen, onClose, operation }: OperationDetailsModalProps) {
    if (!operation) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Деталі операції" size="md">
                <div className="text-sm text-muted-foreground">Оберіть операцію для перегляду.</div>
            </Modal>
        );
    }

    const typeLabels: Record<string, string> = {
        payment: 'Платіж',
        refund: 'Повернення',
        transfer: 'Переказ',
        withdrawal: 'Видача',
        deposit: 'Внесення',
    };

    const statusLabels: Record<string, string> = {
        completed: 'Завершено',
        pending: 'В обробці',
        cancelled: 'Скасовано',
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Деталі операції" size="md">
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Дата і час
                        </p>
                        <p className="text-sm font-medium text-foreground">
                            {new Date(operation.date).toLocaleString('uk-UA', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            № документа
                        </p>
                        <p className="text-sm font-medium text-foreground">
                            {operation.documentNumber}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Каса
                        </p>
                        <p className="text-sm font-medium text-foreground">
                            {operation.cashRegister}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Клієнт
                        </p>
                        <p className="text-sm font-medium text-foreground">{operation.client}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Сума
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                            ₴ {operation.amount.toLocaleString()}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Метод оплати
                        </p>
                        <p className="text-sm font-medium text-foreground">
                            {operation.paymentMethod}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Тип операції
                        </p>
                        <p className="text-sm font-medium text-foreground">
                            {typeLabels[operation.type] ?? operation.type}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Статус
                        </p>
                        <p className="text-sm font-medium text-foreground">
                            {statusLabels[operation.status] ?? operation.status}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Автор
                        </p>
                        <p className="text-sm font-medium text-foreground">{operation.author}</p>
                    </div>
                </div>

                {operation.description && (
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Опис
                        </p>
                        <p className="text-sm text-foreground">{operation.description}</p>
                    </div>
                )}
            </div>
        </Modal>
    );
}
