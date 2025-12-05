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
    message: string;
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
    confirmText = 'Підтвердити',
    cancelText = 'Скасувати',
    variant = 'warning'
}: ConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <div className="text-center">
                <div className={`mx-auto flex items-center justify-center w-12 h-12 rounded-full mb-4 ${variant === 'danger' ? 'bg-destructive/10' :
                    variant === 'warning' ? 'bg-yellow-500/10' :
                        'bg-primary/10'
                    }`}>
                    <AlertTriangle className={`w-6 h-6 ${variant === 'danger' ? 'text-destructive' :
                        variant === 'warning' ? 'text-yellow-500' :
                            'text-primary'
                        }`} />
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2 font-heading">
                    {title}
                </h3>

                <p className="text-sm text-muted-foreground mb-6">
                    {message}
                </p>

                <div className="flex justify-center">
                    <ButtonGroup variant="ghost" className="w-full justify-center">
                        <Button
                            onClick={onClose}
                            className="flex-1"
                        >
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
