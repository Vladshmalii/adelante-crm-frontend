"use client";

import { Loader } from "./ui/Loader";

interface GlobalLoaderProps {
    /** Показывать ли глобальный лоадер */
    isVisible: boolean;
}

export function GlobalLoader({ isVisible }: GlobalLoaderProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-xl bg-card/90 px-6 py-4 shadow-xl border border-border">
                <Loader size="lg" />
                <span className="text-sm text-muted-foreground">Завантаження...</span>
            </div>
        </div>
    );
}
