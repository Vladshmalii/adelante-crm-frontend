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
    position = 'center',
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
        <div
            className={clsx(
                'fixed inset-0 z-[100] flex',
                position === 'center'
                    ? 'animate-fade-in items-end justify-center sm:items-center sm:p-4'
                    : 'animate-fade-in justify-end',
            )}
        >
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            <div
                className={clsx(
                    'relative flex w-full flex-col border-border bg-card shadow-2xl',
                    position === 'center' && [
                        'animate-scale-in border-t sm:border',
                        'max-h-[95vh] sm:max-h-[90vh]',
                        'overflow-hidden rounded-t-3xl sm:rounded-2xl',
                    ],
                    position === 'right' && [
                        'h-full max-h-screen animate-slide-in-right overflow-hidden border-l sm:rounded-l-3xl',
                    ],
                    {
                        'sm:max-w-sm': size === 'xs',
                        'sm:max-w-md': size === 'sm',
                        'sm:max-w-2xl': size === 'md',
                        'sm:max-w-4xl': size === 'lg',
                        'sm:max-w-6xl': size === 'xl',
                        'sm:max-w-7xl': size === '2xl',
                        'sm:h-screen sm:max-h-screen sm:max-w-none sm:rounded-none sm:border-0':
                            size === 'full',
                    },
                )}
            >
                {(title || header) && (
                    <div className="z-10 flex-shrink-0 bg-card">
                        {header ? (
                            header
                        ) : (
                            <div className="flex items-center justify-between border-b border-border p-5 sm:p-7">
                                <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                    {title}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="rounded-xl p-2 text-muted-foreground transition-all hover:scale-110 hover:bg-accent hover:text-accent-foreground active:scale-95"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className={clsx('custom-scrollbar flex-1 overflow-y-auto p-5 sm:p-7')}>
                    {children}
                </div>

                {footer && (
                    <div className="z-10 flex-shrink-0 border-t border-border bg-secondary/30 p-5 backdrop-blur-xl sm:p-7">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
