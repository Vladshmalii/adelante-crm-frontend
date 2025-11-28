'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md'
}: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-fade-in">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={clsx(
                    'relative bg-card shadow-2xl w-full animate-scale-in border-t sm:border border-border',
                    'max-h-[95vh] sm:max-h-[90vh] flex flex-col',
                    'rounded-t-2xl sm:rounded-xl',
                    {
                        'sm:max-w-md': size === 'sm',
                        'sm:max-w-2xl': size === 'md',
                        'sm:max-w-4xl': size === 'lg',
                        'sm:max-w-6xl': size === 'xl',
                    }
                )}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border flex-shrink-0">
                        <h2 className="text-lg sm:text-xl font-semibold text-foreground font-heading">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className={clsx(
                    'overflow-y-auto scrollbar-thin flex-1',
                    title ? 'p-4 sm:p-6' : 'p-4 sm:p-6'
                )}>
                    {children}
                </div>
            </div>
        </div>
    );
}