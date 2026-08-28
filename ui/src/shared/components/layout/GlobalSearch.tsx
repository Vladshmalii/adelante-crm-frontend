import { Search } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';

export function GlobalSearch() {
    const { setSearchOpen } = useUIStore();

    return (
        <>
            <button
                onClick={() => setSearchOpen(true)}
                className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Пошук"
            >
                <Search size={20} />
            </button>
            <button
                onClick={() => setSearchOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground/70 bg-secondary/30 hover:bg-secondary/60 hover:text-foreground border border-transparent hover:border-border/40 rounded-lg transition-all duration-200 w-64 shadow-sm"
            >
                <Search size={15} />
                <span className="font-medium">Пошук...</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border/50 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-sm">
                    <span className="text-xs">Ctrl</span>K
                </kbd>
            </button>
        </>
    );
}
