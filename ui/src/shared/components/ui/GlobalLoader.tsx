'use client';

import { useEffect, useState } from 'react';

interface GlobalLoaderProps {
    isLoading?: boolean;
}

export function GlobalLoader({ isLoading = false }: GlobalLoaderProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isLoading) {
            setShow(true);
        } else {
            const timer = setTimeout(() => setShow(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    if (!show && !isLoading) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300 ${
                isLoading ? 'opacity-100' : 'opacity-0'
            }`}
        >
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-primary" />
                </div>
                <div className="flex items-center gap-1">
                    <span
                        className="h-2 w-2 animate-bounce rounded-full bg-primary"
                        style={{ animationDelay: '0ms' }}
                    />
                    <span
                        className="h-2 w-2 animate-bounce rounded-full bg-primary"
                        style={{ animationDelay: '150ms' }}
                    />
                    <span
                        className="h-2 w-2 animate-bounce rounded-full bg-primary"
                        style={{ animationDelay: '300ms' }}
                    />
                </div>
            </div>
        </div>
    );
}

export function PageLoader() {
    return (
        <div className="flex min-h-[400px] flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="border-3 h-12 w-12 rounded-full border-primary/20" />
                    <div className="border-3 absolute inset-0 h-12 w-12 animate-spin rounded-full border-transparent border-t-primary" />
                </div>
                <p className="animate-pulse text-sm text-muted-foreground">Завантаження...</p>
            </div>
        </div>
    );
}

export function InlineLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-6 h-6 border-2',
        lg: 'w-8 h-8 border-3',
    };

    return (
        <div className="inline-flex items-center justify-center">
            <div
                className={`${sizeClasses[size]} animate-spin rounded-full border-primary/20 border-t-primary`}
            />
        </div>
    );
}
