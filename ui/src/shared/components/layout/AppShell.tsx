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
        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col bg-sidebar lg:flex">
            <div className="animate-pulse space-y-4 p-4">
                <div className="h-10 rounded-lg bg-sidebar-active"></div>
                <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-10 rounded-lg bg-sidebar-active/50"></div>
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
            className="flex min-h-screen overflow-hidden bg-background font-sans text-foreground"
            style={
                {
                    backgroundColor: 'hsl(var(--background))',
                    transition: 'none',
                } as React.CSSProperties
            }
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
                    className="fixed inset-0 z-30 animate-fade-in bg-black/50 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <div
                className={clsx(
                    'relative h-screen flex-1 overflow-hidden overflow-x-hidden transition-[margin-left] duration-300 ease-in-out',
                    isCollapsed ? 'lg:ml-16' : 'lg:ml-64',
                    'ml-0',
                )}
            >
                <main className="flex h-full flex-col overflow-hidden">{children}</main>
            </div>

            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 lg:hidden"
                aria-label={isMobileMenuOpen ? 'Закрити меню' : 'Відкрити меню'}
            >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
        </div>
    );
}
