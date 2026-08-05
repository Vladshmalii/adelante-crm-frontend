import { Search } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';

export function GlobalSearch() {
    const { setSearchOpen } = useUIStore();

    return (
        <>
            <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-muted-foreground transition-colors hover:text-foreground md:hidden"
                aria-label="Пошук"
            >
                <Search size={20} />
            </button>
            <button
                onClick={() => setSearchOpen(true)}
                className="hidden w-64 items-center gap-2 rounded-lg border border-transparent bg-secondary/30 px-3 py-1.5 text-sm text-muted-foreground/70 shadow-sm transition-all duration-200 hover:border-border/40 hover:bg-secondary/60 hover:text-foreground md:flex"
            >
                <Search size={15} />
                <span className="font-medium">Пошук...</span>
                <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border border-border/50 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-sm">
                    <span className="text-xs">Ctrl</span>K
                </kbd>
            </button>
        </>
    );
}
