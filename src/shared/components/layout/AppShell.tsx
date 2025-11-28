'use client';

import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
    children: ReactNode;
    activeSection?: string;
}

export function AppShell({ children, activeSection }: AppShellProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background flex font-sans text-foreground">
            <Sidebar
                activeSection={activeSection}
                isMobileMenuOpen={isMobileMenuOpen}
                onMobileMenuClose={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden animate-fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <main className="flex-1 lg:ml-64 min-h-screen transition-all duration-300 ease-in-out">
                {children}
            </main>

            {/* Mobile menu button */}
            <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 flex items-center justify-center z-20 active:scale-95 transition-transform"
                aria-label="Відкрити меню"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
        </div>
    );
}
