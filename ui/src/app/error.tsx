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
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md text-center">
                <div className="mb-8 flex justify-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                    </div>
                </div>

                <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">
                    Щось пішло не так
                </h1>
                <p className="mb-2 text-muted-foreground">
                    Виникла неочікувана помилка. Ми вже працюємо над її виправленням.
                </p>

                {process.env.NODE_ENV === 'development' && (
                    <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-left">
                        <p className="break-all font-mono text-xs text-destructive">
                            {error.message}
                        </p>
                        {error.digest && (
                            <p className="mt-2 font-mono text-xs text-muted-foreground">
                                Digest: {error.digest}
                            </p>
                        )}
                    </div>
                )}

                <div className="mb-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground shadow-md shadow-primary/20 transition-colors hover:bg-primary-hover"
                    >
                        <RotateCcw className="h-5 w-5" />
                        Спробувати знову
                    </button>
                    <Link
                        href="/ui/public"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-6 py-3 font-medium text-secondary-foreground transition-colors hover:bg-secondary-hover"
                    >
                        <Home className="h-5 w-5" />
                        На головну
                    </Link>
                </div>

                <div className="border-t border-border pt-6">
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
