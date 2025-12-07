'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, Users, Briefcase, FileText, Settings, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useHotkeys } from '@/shared/hooks/useHotkeys';
import { Dialog, DialogContent, DialogTitle } from '../ui/Dialog';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/useUIStore';
import { clientsApi } from '@/lib/api/clients';

interface SearchResult {
    id: string;
    type: 'client' | 'staff' | 'service' | 'appointment' | 'page';
    title: string;
    subtitle?: string;
    url: string;
    icon: any;
}

export function GlobalSearchDialog() {
    const { isSearchOpen, setSearchOpen } = useUIStore();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const [results, setResults] = useState<SearchResult[]>([]);

    useEffect(() => {
        if (!isSearchOpen) {
            setQuery('');
            setResults([]);
        }
    }, [isSearchOpen]);

    useEffect(() => {
        const search = async () => {
            if (!query) {
                setResults([]);
                return;
            }

            const lowerQuery = query.toLowerCase();

            // Static pages
            const pages: SearchResult[] = [
                { id: 'p1', type: 'page', title: 'Календар', url: '/calendar', icon: Calendar },
                { id: 'p2', type: 'page', title: 'Клієнти', url: '/clients', icon: Users },
                { id: 'p3', type: 'page', title: 'Персонал', url: '/staff', icon: Briefcase },
                { id: 'p4', type: 'page', title: 'Фінанси', url: '/finances', icon: FileText },
                { id: 'p5', type: 'page', title: 'Налаштування', url: '/settings', icon: Settings },
            ];

            const matchingPages = pages.filter(p => p.title.toLowerCase().includes(lowerQuery));

            let clientResults: SearchResult[] = [];
            if (query.length >= 2) {
                try {
                    const response = await clientsApi.getAll({ search: query, perPage: 5 });
                    clientResults = response.data.map(client => ({
                        id: client.id,
                        type: 'client',
                        title: `${client.firstName} ${client.lastName || ''}`.trim(),
                        subtitle: client.phone,
                        url: `/clients?id=${client.id}`,
                        icon: Users
                    }));
                } catch (e) {
                    console.error('Search failed', e);
                }
            }

            setResults([...matchingPages, ...clientResults]);
            setSelectedIndex(0);
        };

        const timeoutId = setTimeout(search, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    // Keyboard navigation within the dialog is handled natively by inputs usually, 
    // but custom arrow keys here:
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault();
            handleSelect(results[selectedIndex]);
        }
    };

    const handleSelect = (result: SearchResult) => {
        router.push(result.url);
        setSearchOpen(false);
        setQuery('');
    };

    return (
        <Dialog open={isSearchOpen} onOpenChange={setSearchOpen}>
            <DialogContent className="p-0 gap-0 max-w-2xl overflow-hidden bg-background shadow-2xl border border-border/50 sm:rounded-xl">
                <div className="sr-only">
                    <DialogTitle>Глобальний пошук</DialogTitle>
                </div>

                <div className="flex items-center px-4 py-4 border-b border-border/40">
                    <Search className="mr-3 h-5 w-5 text-muted-foreground/50" />
                    <input
                        className="flex h-10 w-full rounded-md bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Пошук клієнтів, сторінок..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                </div>

                {results.length > 0 && (
                    <div className="max-h-[300px] overflow-y-auto py-2">
                        {results.map((result, index) => {
                            const Icon = result.icon;
                            return (
                                <div
                                    key={result.id}
                                    onClick={() => handleSelect(result)}
                                    className={cn(
                                        "group flex items-center gap-3 px-4 py-3 mx-2 rounded-lg cursor-pointer transition-all duration-200",
                                        selectedIndex === index
                                            ? "bg-primary/10 text-primary-foreground"
                                            : "hover:bg-muted text-foreground"
                                    )}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-8 h-8 rounded-md transition-colors",
                                        selectedIndex === index
                                            ? "bg-primary text-white"
                                            : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                                    )}>
                                        <Icon size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <div className={cn(
                                            "text-sm font-medium",
                                            selectedIndex === index ? "text-primary-foreground" : ""
                                        )}>
                                            {result.title}
                                        </div>
                                        {result.subtitle && (
                                            <div className={cn(
                                                "text-xs mt-0.5",
                                                selectedIndex === index ? "text-primary-foreground/70" : "text-muted-foreground"
                                            )}>
                                                {result.subtitle}
                                            </div>
                                        )}
                                    </div>
                                    {selectedIndex === index && (
                                        <ArrowRight size={16} className="text-primary-foreground opacity-70" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {query && results.length === 0 && (
                    <div className="py-12 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                            <Search className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">Нічого не знайдено</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Спробуйте змінити запит</p>
                    </div>
                )}

                {!query && (
                    <div className="py-12 text-center">
                        <p className="text-sm text-muted-foreground font-medium">Почніть вводити для пошуку</p>
                    </div>
                )}

                <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-t border-border/40 mt-auto">
                    <div className="flex gap-4 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                            <div className="flex gap-0.5">
                                <kbd className="hidden sm:inline-flex h-5 w-5 items-center justify-center rounded border border-border/50 bg-background font-mono text-[10px] font-medium text-muted-foreground shadow-[0_1px_0_0_rgba(0,0,0,0.02)]">
                                    <span className="text-xs mb-0.5">↑</span>
                                </kbd>
                                <kbd className="hidden sm:inline-flex h-5 w-5 items-center justify-center rounded border border-border/50 bg-background font-mono text-[10px] font-medium text-muted-foreground shadow-[0_1px_0_0_rgba(0,0,0,0.02)]">
                                    <span className="text-xs mb-0.5">↓</span>
                                </kbd>
                            </div>
                            Навігація
                        </span>
                        <span className="flex items-center gap-1.5">
                            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border/50 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-[0_1px_0_0_rgba(0,0,0,0.02)]">
                                Enter
                            </kbd>
                            Вибір
                        </span>
                        <span className="flex items-center gap-1.5">
                            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border/50 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-[0_1px_0_0_rgba(0,0,0,0.02)]">
                                Esc
                            </kbd>
                            Закрити
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
