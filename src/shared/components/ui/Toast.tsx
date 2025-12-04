import { X } from 'lucide-react';
import { ReactNode } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    id: string;
    title?: string;
    message: string;
    variant?: ToastVariant;
    onClose: (id: string) => void;
}

const variantAccentClasses: Record<ToastVariant, string> = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    warning: 'bg-amber-400',
    info: 'bg-sky-500',
};

export function Toast({ id, title, message, variant = 'info', onClose }: ToastProps) {
    return (
        <div
            className="pointer-events-auto w-full max-w-sm rounded-lg shadow-lg overflow-hidden border border-border bg-popover/95 text-foreground"
        >
            <div className="flex items-stretch">
                <div className={`w-1 ${variantAccentClasses[variant]}`} />
                <div className="p-3 flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                        {title && (
                            <p className="text-sm font-semibold mb-0.5">
                                {title}
                            </p>
                        )}
                        <p className="text-sm break-words">
                            {message}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onClose(id)}
                        className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs hover:bg-secondary transition-colors flex-shrink-0"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
