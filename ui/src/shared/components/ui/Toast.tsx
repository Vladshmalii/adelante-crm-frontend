'use client';

import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import clsx from 'clsx';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    id: string;
    title?: string;
    message: string;
    variant?: ToastVariant;
    onClose: (id: string) => void;
}

const variantStyles: Record<
    ToastVariant,
    {
        icon: React.ReactNode;
        iconColor: string;
    }
> = {
    success: {
        iconColor: 'text-success',
        icon: <CheckCircle2 className="h-5 w-5" />,
    },
    error: {
        iconColor: 'text-destructive',
        icon: <AlertCircle className="h-5 w-5" />,
    },
    warning: {
        iconColor: 'text-warning',
        icon: <AlertTriangle className="h-5 w-5" />,
    },
    info: {
        iconColor: 'text-primary',
        icon: <Info className="h-5 w-5" />,
    },
};

export function Toast({ id, title, message, variant = 'info', onClose }: ToastProps) {
    const styles = variantStyles[variant];

    return (
        <div
            className={clsx(
                'pointer-events-auto w-full max-w-sm rounded-xl border border-border bg-card text-foreground shadow-lg',
                'flex gap-3 p-4 transition-all duration-300',
            )}
        >
            <div className={clsx('mt-0.5 shrink-0', styles.iconColor)}>{styles.icon}</div>

            <div className="min-w-0 flex-1">
                {title && <p className="mb-1 text-sm font-semibold text-foreground">{title}</p>}
                <p
                    className={clsx(
                        'text-sm',
                        title ? 'text-muted-foreground' : 'font-medium text-foreground',
                    )}
                >
                    {message}
                </p>
            </div>

            <button
                type="button"
                onClick={() => onClose(id)}
                className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
