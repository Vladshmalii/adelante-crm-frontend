'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-8 flex justify-center">
                    <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-12 h-12 text-destructive" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-foreground mb-2 font-heading">
                    Щось пішло не так
                </h1>
                <p className="text-muted-foreground mb-2">
                    Виникла неочікувана помилка. Ми вже працюємо над її виправленням.
                </p>

                {process.env.NODE_ENV === 'development' && (
                    <div className="mb-6 p-4 bg-destructive/5 border border-destructive/20 rounded-lg text-left">
                        <p className="text-xs font-mono text-destructive break-all">
                            {error.message}
                        </p>
                        {error.digest && (
                            <p className="text-xs font-mono text-muted-foreground mt-2">
                                Digest: {error.digest}
                            </p>
                        )}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-md shadow-primary/20"
                    >
                        <RotateCcw className="w-5 h-5" />
                        Спробувати знову
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary-hover transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        На головну
                    </Link>
                </div>

                <div className="pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                        Якщо проблема повторюється,{' '}
                        <Link href="/settings" className="text-primary hover:underline">
                            зверніться до підтримки
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
