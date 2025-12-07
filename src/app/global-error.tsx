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
                <div className="min-h-screen bg-background flex items-center justify-center p-4">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Критична помилка</h2>
                        <p className="text-muted-foreground mb-4">
                            Відбулася непередбачена помилка додатку.
                        </p>
                        <button
                            onClick={() => reset()}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
                        >
                            Спробувати знову
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
