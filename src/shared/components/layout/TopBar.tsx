'use client';

import { ChevronLeft, ChevronRight, Calendar, Layers, LayoutGrid, CalendarRange } from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import clsx from 'clsx';
import { CalendarView } from '@/features/calendar/types';
import { NotificationsDropdown, Notification } from '@/shared/components/ui/NotificationsDropdown';
import { ProfileDropdown } from '@/shared/components/ui/ProfileDropdown';
import { GlobalSearch } from '@/shared/components/layout/GlobalSearch';
import { StaffRole } from '@/features/staff/types';

interface TopBarProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    view: CalendarView;
    onViewChange: (view: CalendarView) => void;
    notifications: Notification[];
    onMarkNotificationAsRead: (id: string) => void;
    onMarkAllNotificationsAsRead: () => void;
    onDeleteNotification: (id: string) => void;
    userName: string;
    userRole: StaffRole;
    userAvatar?: string;
    onProfileClick: () => void;
    onSettingsClick: () => void;
    onLogout: () => void;
}

export function TopBar({
    currentDate,
    onDateChange,
    view,
    onViewChange,
    notifications,
    onMarkNotificationAsRead,
    onMarkAllNotificationsAsRead,
    onDeleteNotification,
    userName,
    userRole,
    userAvatar,
    onProfileClick,
    onSettingsClick,
    onLogout,
}: TopBarProps) {
    const goToToday = () => {
        onDateChange(new Date());
    };

    const goToPrevious = () => {
        const newDate = new Date(currentDate);
        if (view === 'day') {
            newDate.setDate(newDate.getDate() - 1);
        } else if (view === 'week') {
            newDate.setDate(newDate.getDate() - 7);
        } else {
            newDate.setMonth(newDate.getMonth() - 1);
        }
        onDateChange(newDate);
    };

    const goToNext = () => {
        const newDate = new Date(currentDate);
        if (view === 'day') {
            newDate.setDate(newDate.getDate() + 1);
        } else if (view === 'week') {
            newDate.setDate(newDate.getDate() + 7);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        onDateChange(newDate);
    };

    const dayName = format(currentDate, 'EEEE', { locale: uk });
    const dateFormatted = format(currentDate, 'd MMMM, yyyy', { locale: uk });

    const viewOptions = [
        { id: 'day', label: 'День', icon: LayoutGrid },
        { id: 'week', label: 'Тиждень', icon: Layers },
        { id: 'month', label: 'Місяць', icon: CalendarRange },
    ] as const;

    return (
        <header className="h-20 bg-background/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40 transition-all flex items-center px-4 sm:px-8">
            <div className="w-full flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">

                {/* DATE NAVIGATION */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 min-w-0">
                    <div className="flex items-center bg-muted/40 p-1.5 rounded-2xl border border-border/10">
                        <button
                            onClick={goToPrevious}
                            className="p-2 hover:bg-background hover:text-primary rounded-xl transition-all active:scale-90 text-muted-foreground"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <button
                            onClick={goToToday}
                            className="px-4 py-2 text-xs font-black uppercase tracking-wider text-foreground hover:text-primary transition-all"
                        >
                            Сьогодні
                        </button>

                        <button
                            onClick={goToNext}
                            className="p-2 hover:bg-background hover:text-primary rounded-xl transition-all active:scale-90 text-muted-foreground"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-col min-w-[140px]">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary leading-none mb-1 whitespace-nowrap">
                            {dayName}
                        </span>
                        <h1 className="text-lg font-black text-foreground font-heading tracking-tight leading-none flex items-center gap-2 whitespace-nowrap">
                            {dateFormatted}
                            <Calendar className="w-4 h-4 text-muted-foreground/30" />
                        </h1>
                    </div>
                </div>

                {/* SEARCH & VIEW & USER */}
                <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4 lg:gap-6">
                    {/* View Switcher - Premium Style */}
                    <div className="hidden xl:flex bg-muted/40 p-1 rounded-xl border border-border/10">
                        {viewOptions.map((opt) => {
                            const Icon = opt.icon;
                            const isActive = view === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => onViewChange(opt.id as CalendarView)}
                                    className={clsx(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                        isActive
                                            ? "bg-background text-primary shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Icon className={clsx("w-3.5 h-3.5", isActive ? "text-primary" : "text-muted-foreground/50")} />
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="h-8 w-px bg-border/50 hidden sm:block" />

                    <div className="flex items-center gap-3">
                        <GlobalSearch />

                        <NotificationsDropdown
                            notifications={notifications}
                            onMarkAsRead={onMarkNotificationAsRead}
                            onMarkAllAsRead={onMarkAllNotificationsAsRead}
                            onDelete={onDeleteNotification}
                        />

                        <div className="h-8 w-px bg-border/50" />

                        <ProfileDropdown
                            userName={userName}
                            userRole={userRole}
                            userAvatar={userAvatar}
                            onProfileClick={onProfileClick}
                            onSettingsClick={onSettingsClick}
                            onLogout={onLogout}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}