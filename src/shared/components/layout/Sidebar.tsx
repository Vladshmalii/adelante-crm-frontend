'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import {
    Calendar,
    Users,
    LayoutDashboard,
    Banknote,
    Package,
    Gift,
    Settings,
    ChevronLeft,
    User,
    Briefcase,
    Plus,
} from 'lucide-react';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';

interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    subItems?: { label: string; href: string; tab: string }[];
}

const navItems: NavItem[] = [
    { id: 'calendar', label: 'Розклад', icon: Calendar, href: '/calendar' },
    { id: 'staff', label: 'Співробітники', icon: Users, href: '/staff' },
    { id: 'clients', label: 'Клієнти', icon: User, href: '/clients' },
    { id: 'services', label: 'Послуги', icon: Briefcase, href: '/services' },
    {
        id: 'overview',
        label: 'Огляд',
        icon: LayoutDashboard,
        href: '/overview',
        subItems: [
            { label: 'Записи', href: '/overview?tab=records', tab: 'records' },
            { label: 'Відгуки', href: '/overview?tab=reviews', tab: 'reviews' },
            { label: 'Зміни', href: '/overview?tab=changes', tab: 'changes' },
        ]
    },
    { id: 'finances', label: 'Фінанси', icon: Banknote, href: '/finances' },
    { id: 'inventory', label: 'Склад', icon: Package, href: '/inventory' },
    { id: 'loyalty', label: 'Лояльність', icon: Gift, href: '/loyalty' },
    {
        id: 'settings',
        label: 'Налаштування',
        icon: Settings,
        href: '/settings',
        subItems: [
            { label: 'Салону', href: '/settings?tab=salon', tab: 'salon' },
            { label: 'Профілю', href: '/settings?tab=profile', tab: 'profile' },
            { label: 'Ролі та доступи', href: '/settings?tab=roles', tab: 'roles' },
            { label: 'Загальні', href: '/settings?tab=general', tab: 'general' },
            { label: 'Звіти', href: '/settings?tab=reports', tab: 'reports' },
        ],
    },
];


interface SidebarProps {
    activeSection?: string;
    isMobileMenuOpen?: boolean;
    onMobileMenuClose?: () => void;
    isCollapsed?: boolean;
    onCollapseChange?: (collapsed: boolean) => void;
}

export function Sidebar({
    activeSection = 'calendar',
    isMobileMenuOpen = false,
    onMobileMenuClose,
    isCollapsed: externalIsCollapsed,
    onCollapseChange
}: SidebarProps) {
    const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
    const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed;

    const handleCollapseToggle = () => {
        const newCollapsed = !isCollapsed;
        if (onCollapseChange) {
            onCollapseChange(newCollapsed);
        } else {
            setInternalIsCollapsed(newCollapsed);
        }
    };
    const [selectedDate, setSelectedDate] = useState('');
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('tab');
    const router = useRouter();

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        router.push(`/calendar?date=${date}`);
    };

    return (
        <aside
            className={clsx(
                'fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground shadow-xl',
                'flex flex-col border-r border-sidebar-border',
                'z-50 transition-all duration-300 ease-in-out',
                'w-64', // Base width for mobile and expanded desktop
                isCollapsed && 'lg:w-16', // Collapsed width for desktop
                isMobileMenuOpen ? 'translate-x-0' : 'max-lg:-translate-x-full'
            )}
            style={{
                backgroundColor: 'hsl(var(--sidebar))',
            } as React.CSSProperties}
        >
            <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
                <div
                    className="flex items-center gap-2 overflow-hidden transition-all duration-300"
                    style={{
                        opacity: isCollapsed ? 0 : 1,
                        width: isCollapsed ? 0 : 'auto',
                        pointerEvents: isCollapsed ? 'none' : 'auto',
                    }}
                >
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                        <Calendar className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-heading font-bold text-lg tracking-tight whitespace-nowrap">Adelante CRM</span>
                </div>
                <button
                    onClick={handleCollapseToggle}
                    className="hidden lg:block p-1.5 hover:bg-sidebar-active rounded-lg transition-colors text-sidebar-muted hover:text-sidebar-foreground flex-shrink-0"
                    style={{
                        marginLeft: isCollapsed ? 'auto' : undefined,
                    }}
                >
                    <ChevronLeft
                        className={clsx(
                            'w-5 h-5 transition-transform duration-300 ease-in-out',
                            isCollapsed && 'rotate-180'
                        )}
                    />
                </button>
            </div>

            <div
                className="border-b border-sidebar-border overflow-hidden transition-all duration-300"
                style={{
                    opacity: isCollapsed ? 0 : 1,
                    maxHeight: isCollapsed ? 0 : '400px',
                    paddingTop: isCollapsed ? 0 : '1rem',
                    paddingBottom: isCollapsed ? 0 : '1rem',
                    pointerEvents: isCollapsed ? 'none' : 'auto',
                }}
            >
                <div className="px-3">
                    <DatePicker
                        value={selectedDate}
                        onChange={handleDateChange}
                        inline
                        theme="dark"
                    />
                </div>
            </div>

            <div className="px-2 mt-4 mb-2">
                <button
                    onClick={() => router.push(`/calendar?create=${Date.now()}`)}
                    className={clsx(
                        'w-full flex items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all duration-200 group active:scale-95',
                        isCollapsed ? 'p-2.5' : 'gap-2 px-3 py-2.5'
                    )}
                    title={isCollapsed ? 'Додати запис' : undefined}
                >
                    <Plus className={clsx("w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:rotate-90")} />
                    <span
                        className="text-sm font-semibold overflow-hidden whitespace-nowrap transition-all duration-300 font-heading"
                        style={{
                            opacity: isCollapsed ? 0 : 1,
                            width: isCollapsed ? 0 : 'auto',
                        }}
                    >
                        Додати запис
                    </span>
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
                <ul className="space-y-1 px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.id === activeSection;
                        const hasSubItems = item.subItems && item.subItems.length > 0;

                        return (
                            <li key={item.id}>
                                <Link
                                    href={item.href}
                                    onClick={() => onMobileMenuClose?.()}
                                    className={clsx(
                                        'flex items-center rounded-lg transition-all duration-200 group relative',
                                        isActive
                                            ? 'bg-primary hover:bg-primary-hover text-primary-foreground shadow-md shadow-primary/30'
                                            : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-active',
                                        isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                                    )}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <Icon className={clsx("w-5 h-5 flex-shrink-0 transition-transform duration-200", !isActive && "group-hover:scale-110")} />
                                    <span
                                        className="text-sm font-medium overflow-hidden whitespace-nowrap transition-all duration-300"
                                        style={{
                                            opacity: isCollapsed ? 0 : 1,
                                            width: isCollapsed ? 0 : 'auto',
                                        }}
                                    >
                                        {item.label}
                                    </span>
                                </Link>

                                {isActive && hasSubItems && !isCollapsed && (
                                    <ul className="mt-1 ml-4 border-l border-sidebar-border pl-2 space-y-1 animate-fade-in">
                                        {item.subItems!.map((subItem) => {
                                            const isSubActive = currentTab === subItem.tab ||
                                                (!currentTab && subItem.tab === 'records' && item.id === 'overview') ||
                                                (!currentTab && subItem.tab === 'salon' && item.id === 'settings');
                                            return (
                                                <li key={subItem.href}>
                                                    <Link
                                                        href={subItem.href}
                                                        scroll={false}
                                                        className={clsx(
                                                            'block px-3 py-2 text-sm rounded-lg transition-colors',
                                                            isSubActive
                                                                ? 'text-sidebar-foreground bg-sidebar-active font-medium'
                                                                : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-active'
                                                        )}
                                                    >
                                                        {subItem.label}
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div
                className="border-t border-sidebar-border overflow-hidden transition-all duration-300"
                style={{
                    opacity: isCollapsed ? 0 : 1,
                    maxHeight: isCollapsed ? 0 : '200px',
                    padding: isCollapsed ? 0 : '1rem',
                    pointerEvents: isCollapsed ? 'none' : 'auto',
                }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                        <User className="w-5 h-5 text-sidebar-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm font-semibold truncate font-heading">Адміністратор</p>
                        <p className="text-xs text-sidebar-muted truncate">admin@salon.ua</p>
                    </div>
                    <ThemeToggle className="text-sidebar-muted hover:text-sidebar-foreground flex-shrink-0" />
                </div>
            </div>
        </aside>
    );
}