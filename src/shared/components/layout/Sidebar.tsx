'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
    Calendar,
    Users,
    LayoutDashboard,
    Banknote,
    Package,
    Gift,
    Plug,
    Settings,
    HelpCircle,
    ChevronLeft,
    Mail,
    User,
    Briefcase,
    BarChart3,
} from 'lucide-react';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';

interface NavItem {
    id: string;
    label: string;
    icon: any;
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
}

export function Sidebar({ activeSection = 'calendar', isMobileMenuOpen = false, onMobileMenuClose }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
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
                'fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 shadow-xl',
                'flex flex-col border-r border-sidebar-border',
                'lg:z-40',
                isCollapsed ? 'lg:w-16' : 'lg:w-64',
                'z-40 w-64',
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            )}
        >
            <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
                {!isCollapsed && (
                    <div className="flex items-center gap-2 animate-fade-in">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                            <Calendar className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="font-heading font-bold text-lg tracking-tight">Adelante CRM</span>
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden lg:block p-1.5 hover:bg-sidebar-active rounded-lg transition-colors ml-auto text-sidebar-muted hover:text-sidebar-foreground"
                >
                    <ChevronLeft
                        className={clsx(
                            'w-5 h-5 transition-transform duration-300',
                            isCollapsed && 'rotate-180'
                        )}
                    />
                </button>
            </div>

            {!isCollapsed && (
                <div className="px-3 py-4 border-b border-sidebar-border">
                    <DatePicker
                        value={selectedDate}
                        onChange={handleDateChange}
                        inline
                        theme="dark"
                    />
                </div>
            )}

            <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
                <ul className="space-y-1 px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.id === activeSection;
                        const hasSubItems = item.subItems && item.subItems.length > 0;

                        return (
                            <li key={item.id}>
                                <a
                                    href={item.href}
                                    onClick={() => onMobileMenuClose?.()}
                                    className={clsx(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden',
                                        isActive
                                            ? 'bg-primary hover:bg-primary-hover text-primary-foreground shadow-md shadow-primary/30'
                                            : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-active',
                                        isCollapsed && 'justify-center'
                                    )}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <Icon className={clsx("w-5 h-5 flex-shrink-0 transition-transform duration-200", !isActive && "group-hover:scale-110")} />
                                    {!isCollapsed && (
                                        <span className="text-sm font-medium animate-fade-in">{item.label}</span>
                                    )}
                                </a>

                                {isActive && hasSubItems && !isCollapsed && (
                                    <ul className="mt-1 ml-4 border-l border-sidebar-border pl-2 space-y-1 animate-fade-in">
                                        {item.subItems!.map((subItem) => {
                                            const isSubActive = currentTab === subItem.tab ||
                                                (!currentTab && subItem.tab === 'records' && item.id === 'overview') ||
                                                (!currentTab && subItem.tab === 'salon' && item.id === 'settings');
                                            return (
                                                <li key={subItem.href}>
                                                    <button
                                                        type="button"
                                                        onClick={() => router.push(subItem.href, { scroll: false })}
                                                        className={clsx(
                                                            'w-full text-left block px-3 py-2 text-sm rounded-lg transition-colors',
                                                            isSubActive
                                                                ? 'text-sidebar-foreground bg-sidebar-active font-medium'
                                                                : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-active'
                                                        )}
                                                    >
                                                        {subItem.label}
                                                    </button>
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

            {!isCollapsed && (
                <div className="p-4 border-t border-sidebar-border animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center shadow-lg">
                            <User className="w-5 h-5 text-sidebar-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate font-heading">Адміністратор</p>
                            <p className="text-xs text-sidebar-muted truncate">admin@salon.ua</p>
                        </div>
                        <ThemeToggle className="text-sidebar-muted hover:text-sidebar-foreground" />
                    </div>
                </div>
            )}
        </aside>
    );
}