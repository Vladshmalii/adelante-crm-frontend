'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div className="flex min-h-screen items-center justify-center bg-background p-4">
                    <div className="text-center">
                        <h2 className="mb-4 text-2xl font-bold">Критична помилка</h2>
                        <p className="mb-4 text-muted-foreground">
                            Відбулася непередбачена помилка додатку.
                        </p>
                        <button
                            onClick={() => reset()}
                            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
                        >
                            Спробувати знову
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
