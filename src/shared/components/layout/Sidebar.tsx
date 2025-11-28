'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
    Calendar,
    Users,
    LayoutDashboard,
    DollarSign,
    Package,
    Gift,
    Plug,
    Settings,
    HelpCircle,
    ChevronLeft,
    Mail,
    User,
} from 'lucide-react';
import { DatePicker } from '@/shared/components/ui/DatePicker';

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
    { id: 'finances', label: 'Фінанси', icon: DollarSign, href: '/finances' },
    { id: 'inventory', label: 'Склад', icon: Package, href: '/inventory' },
    { id: 'loyalty', label: 'Лояльність', icon: Gift, href: '/loyalty' },
    { id: 'integrations', label: 'Інтеграції', icon: Plug, href: '/integrations' },
    { id: 'settings', label: 'Налаштування', icon: Settings, href: '/settings' },
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
                'fixed left-0 top-0 h-screen bg-sidebar text-white transition-all duration-300 shadow-xl',
                'flex flex-col border-r border-white/10',
                // Desktop
                'lg:z-40',
                isCollapsed ? 'lg:w-16' : 'lg:w-64',
                // Mobile
                'z-40 w-64',
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
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
                    className="hidden lg:block p-1.5 hover:bg-white/10 rounded-lg transition-colors ml-auto text-gray-400 hover:text-white"
                >
                    <ChevronLeft
                        className={clsx(
                            'w-5 h-5 transition-transform duration-300',
                            isCollapsed && 'rotate-180'
                        )}
                    />
                </button>
            </div>

            {/* Calendar */}
            {!isCollapsed && (
                <div className="px-3 py-4 border-b border-white/10">
                    <DatePicker
                        value={selectedDate}
                        onChange={handleDateChange}
                        inline
                        theme="dark"
                    />
                </div>
            )}

            {/* Navigation */}
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
                                        'hover:bg-white/5',
                                        isActive ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-gray-400 hover:text-white',
                                        isCollapsed && 'justify-center'
                                    )}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <Icon className={clsx("w-5 h-5 flex-shrink-0 transition-transform duration-200", !isActive && "group-hover:scale-110")} />
                                    {!isCollapsed && (
                                        <span className="text-sm font-medium animate-fade-in">{item.label}</span>
                                    )}
                                    {isActive && !isCollapsed && !hasSubItems && (
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20" />
                                    )}
                                </a>

                                {isActive && hasSubItems && !isCollapsed && (
                                    <ul className="mt-1 ml-4 border-l border-white/10 pl-2 space-y-1 animate-fade-in">
                                        {item.subItems!.map((subItem) => {
                                            const isSubActive = currentTab === subItem.tab || (!currentTab && subItem.tab === 'records' && item.id === 'overview');
                                            return (
                                                <li key={subItem.href}>
                                                    <a
                                                        href={subItem.href}
                                                        className={clsx(
                                                            "block px-3 py-2 text-sm rounded-lg transition-colors",
                                                            isSubActive ? "text-white bg-white/10 font-medium" : "text-gray-400 hover:text-white hover:bg-white/5"
                                                        )}
                                                    >
                                                        {subItem.label}
                                                    </a>
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

            {/* User Info */}
            {!isCollapsed && (
                <div className="p-4 border-t border-white/10 animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center shadow-lg">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate font-heading">Адміністратор</p>
                            <p className="text-xs text-gray-400 truncate">admin@salon.ua</p>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}