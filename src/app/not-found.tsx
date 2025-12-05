'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                <div className="relative mb-8">
                    <div className="text-[150px] font-bold text-primary/10 leading-none select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 animate-bounce">
                            <Search className="w-12 h-12 text-primary-foreground" />
                        </div>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-foreground mb-2 font-heading">
                    Сторінку не знайдено
                </h1>
                <p className="text-muted-foreground mb-8">
                    Схоже, ця сторінка була видалена, переміщена, або ніколи не існувала.
                    Перевірте правильність адреси або поверніться на головну.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-md shadow-primary/20"
                    >
                        <Home className="w-5 h-5" />
                        На головну
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary-hover transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Назад
                    </button>
                </div>

                <div className="mt-12 pt-8 border-t border-border">
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
