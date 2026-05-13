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

const variantStyles: Record<ToastVariant, {
    icon: React.ReactNode;
    iconColor: string;
}> = {
    success: {
        iconColor: 'text-success',
        icon: <CheckCircle2 className="w-5 h-5" />,
    },
    error: {
        iconColor: 'text-destructive',
        icon: <AlertCircle className="w-5 h-5" />,
    },
    warning: {
        iconColor: 'text-warning',
        icon: <AlertTriangle className="w-5 h-5" />,
    },
    info: {
        iconColor: 'text-primary',
        icon: <Info className="w-5 h-5" />,
    },
};

export function Toast({ id, title, message, variant = 'info', onClose }: ToastProps) {
    const styles = variantStyles[variant];

    return (
        <div
            className={clsx(
                "pointer-events-auto w-full max-w-sm rounded-xl shadow-lg border border-border bg-card text-foreground",
                "p-4 flex gap-3 transition-all duration-300"
            )}
        >
            <div className={clsx("shrink-0 mt-0.5", styles.iconColor)}>
                {styles.icon}
            </div>

            <div className="flex-1 min-w-0">
                {title && (
                    <p className="text-sm font-semibold mb-1 text-foreground">
                        {title}
                    </p>
                )}
                <p className={clsx("text-sm", title ? "text-muted-foreground" : "text-foreground font-medium")}>
                    {message}
                </p>
            </div>

            <button
                type="button"
                onClick={() => onClose(id)}
                className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
