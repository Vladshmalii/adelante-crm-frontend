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
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300 ${isLoading ? 'opacity-100' : 'opacity-0'
                }`}
        >
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}

export function PageLoader() {
    return (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-12 h-12 border-3 border-primary/20 rounded-full" />
                    <div className="absolute inset-0 w-12 h-12 border-3 border-transparent border-t-primary rounded-full animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">Завантаження...</p>
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
            <div className={`${sizeClasses[size]} border-primary/20 border-t-primary rounded-full animate-spin`} />
        </div>
    );
}
