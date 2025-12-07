'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        if (open) {
            document.body.style.overflow = 'hidden';

            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    onOpenChange(false);
                }
            };
            window.addEventListener('keydown', handleEsc);

            return () => {
                document.body.style.overflow = '';
                window.removeEventListener('keydown', handleEsc);
            };
        } else {
            document.body.style.overflow = '';
        }

    }, [open, onOpenChange]);

    if (!mounted) return null;
    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center">
            <div
                className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-all duration-100 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in"
                onClick={() => onOpenChange(false)}
            />
            <div className="fixed z-50 grid w-full gap-4 rounded-b-lg border bg-background p-6 shadow-lg animate-in data-[state=open]:fade-in-90 data-[state=open]:slide-in-from-bottom-10 sm:max-w-lg sm:rounded-lg sm:zoom-in-90 data-[state=open]:sm:slide-in-from-bottom-0">
                {children}
            </div>
        </div>,
        document.body
    );
}

export function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={cn("relative grid gap-4 shadow-lg sm:rounded-lg md:w-full", className)}>
            {children}
        </div>
    );
}

export function DialogHeader({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>
            {children}
        </div>
    );
}

export function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
            {children}
        </h2>
    );
}
