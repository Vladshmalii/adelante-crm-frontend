'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md text-center">
                <div className="relative mb-8">
                    <div className="select-none text-[150px] font-bold leading-none text-primary/10">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-24 w-24 animate-bounce items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/20">
                            <Search className="h-12 w-12 text-primary-foreground" />
                        </div>
                    </div>
                </div>

                <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">
                    Сторінку не знайдено
                </h1>
                <p className="mb-8 text-muted-foreground">
                    Схоже, ця сторінка була видалена, переміщена, або ніколи не існувала. Перевірте
                    правильність адреси або поверніться на головну.
                </p>

                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                        href="/ui/public"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground shadow-md shadow-primary/20 transition-colors hover:bg-primary-hover"
                    >
                        <Home className="h-5 w-5" />
                        На головну
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-6 py-3 font-medium text-secondary-foreground transition-colors hover:bg-secondary-hover"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Назад
                    </button>
                </div>

                <div className="mt-12 border-t border-border pt-8">
                    <p className="text-sm text-muted-foreground">
                        Потрібна допомога?{' '}
                        <Link href="/settings" className="text-primary hover:underline">
                            Зв&apos;яжіться з підтримкою
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
