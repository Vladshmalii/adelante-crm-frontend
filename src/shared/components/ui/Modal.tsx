'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: ReactNode;
    header?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | '2xl';
    position?: 'center' | 'right';
}

export function Modal({
    isOpen,
    onClose,
    title,
    header,
    children,
    footer,
    size = 'md',
    position = 'center'
}: ModalProps) {
    useEffect(() => {
        if (!isOpen) return;

        const body = document.body;
        const html = document.documentElement;

        const currentCount = parseInt(body.getAttribute('data-modals-open') || '0');
        const newCount = currentCount + 1;
        body.setAttribute('data-modals-open', newCount.toString());

        if (newCount === 1) {
            const scrollbarWidth = window.innerWidth - html.clientWidth;
            body.style.overflow = 'hidden';
            if (scrollbarWidth > 0) {
                body.style.paddingRight = `${scrollbarWidth}px`;
            }
        }

        return () => {
            const currentCount = parseInt(body.getAttribute('data-modals-open') || '0');
            const newCount = Math.max(0, currentCount - 1);
            body.setAttribute('data-modals-open', newCount.toString());

            if (newCount === 0) {
                body.style.overflow = '';
                body.style.paddingRight = '';
            }
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
        <div className={clsx(
            "fixed inset-0 z-[100] flex",
            position === 'center' ? "items-end sm:items-center justify-center sm:p-4 animate-fade-in" : "justify-end animate-fade-in"
        )}>
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            <div
                className={clsx(
                    'relative bg-card shadow-2xl w-full flex flex-col border-border',
                    position === 'center' && [
                        'animate-scale-in border-t sm:border',
                        'max-h-[95vh] sm:max-h-[90vh]',
                        'rounded-t-3xl sm:rounded-2xl overflow-hidden'
                    ],
                    position === 'right' && [
                        'h-full max-h-screen border-l animate-slide-in-right sm:rounded-l-3xl overflow-hidden'
                    ],
                    {
                        'sm:max-w-sm': size === 'xs',
                        'sm:max-w-md': size === 'sm',
                        'sm:max-w-2xl': size === 'md',
                        'sm:max-w-4xl': size === 'lg',
                        'sm:max-w-6xl': size === 'xl',
                        'sm:max-w-7xl': size === '2xl',
                        'sm:max-w-none sm:h-screen sm:max-h-screen sm:rounded-none sm:border-0': size === 'full',
                    }
                )}
            >
                {(title || header) && (
                    <div className="flex-shrink-0 bg-card z-10">
                        {header ? header : (
                            <div className="flex items-center justify-between p-5 sm:p-7 border-b border-border">
                                <h2 className="text-xl sm:text-2xl font-bold text-foreground font-heading tracking-tight">{title}</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-accent hover:text-accent-foreground transition-all text-muted-foreground hover:scale-110 active:scale-95"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className={clsx(
                    'overflow-y-auto custom-scrollbar flex-1 p-5 sm:p-7',
                )}>
                    {children}
                </div>

                {footer && (
                    <div className="p-5 sm:p-7 border-t border-border flex-shrink-0 bg-secondary/30 backdrop-blur-xl z-10">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}