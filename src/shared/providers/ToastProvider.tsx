"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Toast, ToastVariant } from '../components/ui/Toast';

interface ToastItem {
    id: string;
    message: string;
    title?: string;
    variant: ToastVariant;
    duration?: number;
    isVisible: boolean;
}

interface ToastContextValue {
    show: (message: string, options?: { title?: string; variant?: ToastVariant; duration?: number }) => void;
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    custom: (message: string, options?: { title?: string; variant?: ToastVariant; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
    children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const remove = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const hide = useCallback(
        (id: string) => {
            setToasts(prev => prev.map(t => (t.id === id ? { ...t, isVisible: false } : t)));
            setTimeout(() => {
                remove(id);
            }, 200);
        },
        [remove]
    );

    const show = useCallback(
        (message: string, options?: { title?: string; variant?: ToastVariant; duration?: number }) => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const toast: ToastItem = {
                id,
                message,
                title: options?.title,
                variant: options?.variant || 'info',
                duration: options?.duration ?? 4000,
                isVisible: true,
            };
            setToasts(prev => [...prev, toast]);

            if (toast.duration && toast.duration > 0) {
                setTimeout(() => hide(id), toast.duration);
            }
        },
        [hide]
    );

    const ctxValue: ToastContextValue = useMemo(
        () => ({
            show,
            success: (message, title) => show(message, { title, variant: 'success' }),
            error: (message, title) => show(message, { title, variant: 'error' }),
            warning: (message, title) => show(message, { title, variant: 'warning' }),
            info: (message, title) => show(message, { title, variant: 'info' }),
            custom: (message, options) => show(message, options),
        }),
        [show]
    );

    return (
        <ToastContext.Provider value={ctxValue}>
            {children}
            {mounted &&
                createPortal(
                    <div className="fixed inset-0 flex items-start justify-end px-4 py-6 pointer-events-none z-[9999]">
                        <div className="flex flex-col gap-3 w-full max-w-sm">
                            {toasts.map((toast) => (
                                <div
                                    key={toast.id}
                                    className={`transform transition-all duration-200 ease-out ${toast.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
                                >
                                    <Toast
                                        id={toast.id}
                                        title={toast.title}
                                        message={toast.message}
                                        variant={toast.variant}
                                        onClose={hide}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>,
                    document.body
                )}
        </ToastContext.Provider>
    );
}

export function useToastContext() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToastContext must be used within ToastProvider');
    }
    return ctx;
}
