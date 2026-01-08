'use client';

import { ReactNode, useState, Suspense } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, X } from 'lucide-react';
import clsx from 'clsx';

interface AppShellProps {
    children: ReactNode;
    activeSection?: string;
}

// Fallback skeleton для Sidebar поки він завантажується
function SidebarSkeleton() {
    return (
        <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-sidebar flex-col z-40">
            <div className="animate-pulse p-4 space-y-4">
                <div className="h-10 bg-sidebar-active rounded-lg"></div>
                <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-10 bg-sidebar-active/50 rounded-lg"></div>
                    ))}
                </div>
            </div>
        </aside>
    );
}

export function AppShell({ children, activeSection }: AppShellProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('sidebar-collapsed');
                return stored === 'true';
            } catch {
                return false;
            }
        }
        return false;
    });

    const handleCollapseChange = (collapsed: boolean) => {
        setIsCollapsed(collapsed);
        try {
            localStorage.setItem('sidebar-collapsed', String(collapsed));
        } catch {
            // Ignore localStorage errors
        }
    };

    return (
        <div
            className="min-h-screen bg-background flex font-sans text-foreground overflow-hidden"
            style={{
                backgroundColor: 'hsl(var(--background))',
                transition: 'none',
            } as React.CSSProperties}
        >
            <Suspense fallback={<SidebarSkeleton />}>
                <Sidebar
                    activeSection={activeSection}
                    isMobileMenuOpen={isMobileMenuOpen}
                    onMobileMenuClose={() => setIsMobileMenuOpen(false)}
                    isCollapsed={isCollapsed}
                    onCollapseChange={handleCollapseChange}
                />
            </Suspense>

            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden animate-fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <div
                className={clsx(
                    "flex-1 h-screen overflow-hidden overflow-x-hidden relative transition-[margin-left] duration-300 ease-in-out",
                    isCollapsed ? "lg:ml-16" : "lg:ml-64",
                    "ml-0"
                )}
            >
                <main className="h-full flex flex-col overflow-hidden">
                    {children}
                </main>
            </div>

            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 flex items-center justify-center z-40 active:scale-95 transition-all hover:scale-105"
                aria-label={isMobileMenuOpen ? 'Закрити меню' : 'Відкрити меню'}
            >
                {isMobileMenuOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <Menu className="w-6 h-6" />
                )}
            </button>
        </div>
    );
}

