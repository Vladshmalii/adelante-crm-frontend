'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { LayoutDashboard, MousePointerClick, AlertCircle, Palette, Lock, Copy, BarChart3, Gift, CalendarCheck } from 'lucide-react';

const tabs = [
    { name: 'General UI', href: '/ui-demo', icon: MousePointerClick },
    { name: 'Colors', href: '/ui-demo/colors', icon: Palette },
    { name: 'Form Elements', href: '/ui-demo/forms', icon: LayoutDashboard },
    { name: 'Modals & Loader', href: '/ui-demo/modals', icon: Copy },
    { name: 'Data & Charts', href: '/ui-demo/data', icon: BarChart3 },
    { name: 'Auth Pages', href: '/ui-demo/auth', icon: Lock },
    { name: 'Error Pages', href: '/ui-demo/errors', icon: AlertCircle },
    { name: 'Loyalty', href: '/ui-demo/loyalty', icon: Gift },
    { name: 'Booking', href: '/ui-demo/booking', icon: CalendarCheck },
];

export default function UIDemoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-8">
                            <h1 className="text-lg font-bold text-foreground font-heading">
                                UI Design System
                            </h1>
                            <nav className="flex space-x-1">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = pathname === tab.href;
                                    return (
                                        <Link
                                            key={tab.name}
                                            href={tab.href}
                                            className={clsx(
                                                'inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                                isActive
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                            )}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {tab.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                </div>
            </header>
            <main>
                {children}
            </main>
        </div>
    );
}
