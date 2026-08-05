'use client';

import { useState, useMemo } from 'react';
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
import { mockAppointments } from '@/features/calendar/data/mockAppointments';

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
        ],
    },
    {
        id: 'finances',
        label: 'Фінанси',
        icon: Banknote,
        href: '/finances',
        subItems: [
            { label: 'Огляд', href: '/finances?tab=overview', tab: 'overview' },
            { label: 'Операції', href: '/finances?tab=operations', tab: 'operations' },
            { label: 'Документи', href: '/finances?tab=documents', tab: 'documents' },
            { label: 'Чеки / Каси', href: '/finances?tab=receipts', tab: 'receipts' },
            {
                label: 'Методи оплат',
                href: '/finances?tab=payment-methods',
                tab: 'payment-methods',
            },
        ],
    },
    { id: 'inventory', label: 'Склад', icon: Package, href: '/inventory' },
    {
        id: 'loyalty',
        label: 'Лояльність',
        icon: Gift,
        href: '/loyalty',
        subItems: [
            { label: 'Бонусні програми', href: '/loyalty?tab=bonuses', tab: 'bonuses' },
            { label: 'Знижки', href: '/loyalty?tab=discounts', tab: 'discounts' },
            { label: 'Сертифікати', href: '/loyalty?tab=certificates', tab: 'certificates' },
            { label: 'Бонуси клієнтів', href: '/loyalty?tab=clientBonuses', tab: 'clientBonuses' },
        ],
    },
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
    onCollapseChange,
}: SidebarProps) {
    const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
    const isCollapsed =
        externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed;

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

    // Real workloads from mock appointments
    const mockWorkloads = useMemo(() => {
        const data: Record<string, number> = {};

        // Calculate total minutes per day
        mockAppointments.forEach((apt) => {
            const start = apt.startTime.split(':').map(Number);
            const end = apt.endTime.split(':').map(Number);
            const duration = end[0] * 60 + end[1] - (start[0] * 60 + start[1]);

            data[apt.date] = (data[apt.date] || 0) + duration;
        });

        // Correct math for workload:
        // Assume 6 staff members available, working 8 hours each = 48 hours = 2880 minutes total capacity per day.
        const TOTAL_DAILY_CAPACITY_MINS = 2880;

        const workloads: Record<string, number> = {};
        Object.entries(data).forEach(([dateStr, mins]) => {
            workloads[dateStr] = Math.min(
                Math.floor((mins / TOTAL_DAILY_CAPACITY_MINS) * 100),
                100,
            );
        });

        // ДЕМОНСТРАЦІЯ: Штучно додаємо всі варіанти завантаженості для перших днів поточного місяця,
        // щоб ви могли побачити як виглядають різні комбінації кілець.
        const now = new Date();
        const y = now.getFullYear();
        const m = (now.getMonth() + 1).toString().padStart(2, '0');

        workloads[`${y}-${m}-01`] = 10; // Тільки зелене (трохи)
        workloads[`${y}-${m}-02`] = 25; // Тільки зелене (майже повне)
        workloads[`${y}-${m}-03`] = 33; // Повне зелене
        workloads[`${y}-${m}-04`] = 45; // Зелене + трохи жовтого
        workloads[`${y}-${m}-05`] = 60; // Зелене + майже повне жовте
        workloads[`${y}-${m}-06`] = 66; // Зелене + повне жовте
        workloads[`${y}-${m}-07`] = 80; // Зелене + жовте + трохи червоного
        workloads[`${y}-${m}-08`] = 95; // Зелене + жовте + майже повне червоне
        workloads[`${y}-${m}-09`] = 100; // Всі три кільця повністю заповнені
        workloads[`${y}-${m}-10`] = 0; // Повністю порожній день

        return workloads;
    }, []);

    return (
        <aside
            className={clsx(
                'fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground shadow-xl',
                'flex flex-col border-r border-sidebar-border',
                'z-50 transition-all duration-300 ease-in-out',
                'w-64', // Base width for mobile and expanded desktop
                isCollapsed && 'lg:w-16', // Collapsed width for desktop
                isMobileMenuOpen ? 'translate-x-0' : 'max-lg:-translate-x-full',
            )}
            style={
                {
                    backgroundColor: 'hsl(var(--sidebar))',
                } as React.CSSProperties
            }
        >
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
                <div
                    className="flex items-center gap-2 overflow-hidden transition-all duration-300"
                    style={{
                        opacity: isCollapsed ? 0 : 1,
                        width: isCollapsed ? 0 : 'auto',
                        pointerEvents: isCollapsed ? 'none' : 'auto',
                    }}
                >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
                        <Calendar className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="whitespace-nowrap font-heading text-lg font-bold tracking-tight">
                        Adelante CRM
                    </span>
                </div>
                <button
                    onClick={handleCollapseToggle}
                    className="hidden flex-shrink-0 rounded-lg p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-active hover:text-sidebar-foreground lg:block"
                    style={{
                        marginLeft: isCollapsed ? 'auto' : undefined,
                    }}
                >
                    <ChevronLeft
                        className={clsx(
                            'h-5 w-5 transition-transform duration-300 ease-in-out',
                            isCollapsed && 'rotate-180',
                        )}
                    />
                </button>
            </div>

            <div
                className="overflow-hidden border-b border-sidebar-border transition-all duration-300"
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
                        workloads={mockWorkloads}
                    />
                </div>
            </div>

            <div className="mb-2 mt-4 px-2">
                <button
                    onClick={() => router.push(`/calendar?create=${Date.now()}`)}
                    className={clsx(
                        'group flex w-full items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-all duration-200 hover:bg-primary/90 active:scale-95',
                        isCollapsed ? 'p-2.5' : 'gap-2 px-3 py-2.5',
                    )}
                    title={isCollapsed ? 'Додати запис' : undefined}
                >
                    <Plus
                        className={clsx(
                            'h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:rotate-90',
                        )}
                    />
                    <span
                        className="overflow-hidden whitespace-nowrap font-heading text-sm font-semibold transition-all duration-300"
                        style={{
                            opacity: isCollapsed ? 0 : 1,
                            width: isCollapsed ? 0 : 'auto',
                        }}
                    >
                        Додати запис
                    </span>
                </button>
            </div>

            <nav className="scrollbar-thin flex-1 overflow-y-auto py-4">
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
                                        'group relative flex items-center rounded-lg transition-all duration-200',
                                        isActive
                                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:bg-primary-hover'
                                            : 'text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-foreground',
                                        isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                                    )}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <Icon
                                        className={clsx(
                                            'h-5 w-5 flex-shrink-0 transition-transform duration-200',
                                            !isActive && 'group-hover:scale-110',
                                        )}
                                    />
                                    <span
                                        className="overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300"
                                        style={{
                                            opacity: isCollapsed ? 0 : 1,
                                            width: isCollapsed ? 0 : 'auto',
                                        }}
                                    >
                                        {item.label}
                                    </span>
                                </Link>

                                {isActive && hasSubItems && !isCollapsed && (
                                    <ul className="ml-4 mt-1 animate-fade-in space-y-1 border-l border-sidebar-border pl-2">
                                        {item.subItems!.map((subItem) => {
                                            const isSubActive =
                                                currentTab === subItem.tab ||
                                                (!currentTab &&
                                                    subItem.tab === 'records' &&
                                                    item.id === 'overview') ||
                                                (!currentTab &&
                                                    subItem.tab === 'salon' &&
                                                    item.id === 'settings') ||
                                                (!currentTab &&
                                                    subItem.tab === 'overview' &&
                                                    item.id === 'finances') ||
                                                (!currentTab &&
                                                    subItem.tab === 'bonuses' &&
                                                    item.id === 'loyalty');
                                            return (
                                                <li key={subItem.href}>
                                                    <Link
                                                        href={subItem.href}
                                                        scroll={false}
                                                        className={clsx(
                                                            'block rounded-lg px-3 py-2 text-sm transition-colors',
                                                            isSubActive
                                                                ? 'bg-sidebar-active font-medium text-sidebar-foreground'
                                                                : 'text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-foreground',
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
                className="overflow-hidden border-t border-sidebar-border transition-all duration-300"
                style={{
                    opacity: isCollapsed ? 0 : 1,
                    maxHeight: isCollapsed ? 0 : '200px',
                    padding: isCollapsed ? 0 : '1rem',
                    pointerEvents: isCollapsed ? 'none' : 'auto',
                }}
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-lg">
                        <User className="h-5 w-5 text-sidebar-foreground" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="truncate font-heading text-sm font-semibold">Адміністратор</p>
                        <p className="truncate text-xs text-sidebar-muted">admin@salon.ua</p>
                    </div>
                    <ThemeToggle className="flex-shrink-0 text-sidebar-muted hover:text-sidebar-foreground" />
                </div>
            </div>
        </aside>
    );
}
