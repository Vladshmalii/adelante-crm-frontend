'use client';

import { Modal } from './Modal';
import { Button } from './Button';
import { ButtonGroup } from './ButtonGroup';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    description,
    confirmText = 'Підтвердити',
    cancelText = 'Скасувати',
    variant = 'warning',
}: ConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const displayMessage = message || description;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <div className="text-center">
                <div
                    className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
                        variant === 'danger'
                            ? 'bg-destructive/10'
                            : variant === 'warning'
                              ? 'bg-yellow-500/10'
                              : 'bg-primary/10'
                    }`}
                >
                    <AlertTriangle
                        className={`h-6 w-6 ${
                            variant === 'danger'
                                ? 'text-destructive'
                                : variant === 'warning'
                                  ? 'text-yellow-500'
                                  : 'text-primary'
                        }`}
                    />
                </div>

                <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">{title}</h3>

                <p className="mb-6 text-sm text-muted-foreground">{displayMessage}</p>

                <div className="flex justify-center">
                    <ButtonGroup variant="ghost" className="w-full justify-center">
                        <Button onClick={onClose} className="flex-1">
                            {cancelText}
                        </Button>
                        <Button
                            variant={variant === 'danger' ? 'danger' : 'primary'}
                            onClick={handleConfirm}
                            className="flex-1"
                        >
                            {confirmText}
                        </Button>
                    </ButtonGroup>
                </div>
            </div>
        </Modal>
    );
}
