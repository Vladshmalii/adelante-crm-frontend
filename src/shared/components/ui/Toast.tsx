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
    container: string;
    icon: React.ReactNode;
    indicator: string;
    iconBg: string;
    iconColor: string;
}> = {
    success: {
        container: 'border-emerald-500/20 bg-emerald-500/[0.02]',
        indicator: 'bg-emerald-500',
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-500',
        icon: <CheckCircle2 className="w-5 h-5" />,
    },
    error: {
        container: 'border-destructive/20 bg-destructive/[0.02]',
        indicator: 'bg-destructive',
        iconBg: 'bg-destructive/10',
        iconColor: 'text-destructive',
        icon: <AlertCircle className="w-5 h-5" />,
    },
    warning: {
        container: 'border-amber-500/20 bg-amber-500/[0.02]',
        indicator: 'bg-amber-500',
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-500',
        icon: <AlertTriangle className="w-5 h-5" />,
    },
    info: {
        container: 'border-primary/20 bg-primary/[0.02]',
        indicator: 'bg-primary',
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        icon: <Info className="w-5 h-5" />,
    },
};

export function Toast({ id, title, message, variant = 'info', onClose }: ToastProps) {
    const styles = variantStyles[variant];

    return (
        <div
            className={clsx(
                "pointer-events-auto w-full max-w-sm rounded-[1.5rem] shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)]",
                "overflow-hidden border-2 bg-card/95 backdrop-blur-md text-foreground relative group transition-all duration-300",
                styles.container
            )}
        >
            {/* Vertical Accent Block - Matches Appointment Cards style */}
            <div className={clsx('absolute left-0 inset-y-0 w-1.5', styles.indicator)} />

            <div className="p-4 flex items-start gap-4">
                {/* Icon Circle */}
                <div className={clsx(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 shadow-sm transition-transform duration-300 group-hover:scale-110",
                    styles.iconBg,
                    styles.iconColor
                )}>
                    {styles.icon}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                    {title && (
                        <p className="text-sm font-bold font-heading mb-1 tracking-tight text-foreground">
                            {title}
                        </p>
                    )}
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Close Button */}
                <button
                    type="button"
                    onClick={() => onClose(id)}
                    className="mt-0.5 p-1.5 rounded-xl border border-border/10 text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-90"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
