'use client';

import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import clsx from 'clsx';
import { CalendarView } from '@/features/calendar/types';
import { NotificationsDropdown, Notification } from '@/shared/components/ui/NotificationsDropdown';
import { ProfileDropdown } from '@/shared/components/ui/ProfileDropdown';
import { Button } from '@/shared/components/ui/Button';
import { ButtonGroup } from '@/shared/components/ui/ButtonGroup';
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

    const formattedDate = format(currentDate, 'd MMMM, EEEE', { locale: uk });

    return (
        <div className="h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 transition-all">
            <div className="flex items-center gap-2 sm:gap-4 animate-fade-in-down">
                <button
                    onClick={goToToday}
                    className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                    <span className="hidden sm:inline">Сьогодні</span>
                    <span className="sm:hidden">Сьог.</span>
                </button>

                <ButtonGroup variant="ghost" size="sm">
                    <Button
                        onClick={goToPrevious}
                        leftIcon={<ChevronLeft className="w-4 h-4" />}
                    >
                        <span className="sr-only">Попередній</span>
                    </Button>
                    <Button
                        onClick={goToNext}
                        leftIcon={<ChevronRight className="w-4 h-4" />}
                    >
                        <span className="sr-only">Наступний</span>
                    </Button>
                </ButtonGroup>

                <h1 className="text-sm sm:text-lg font-bold text-foreground capitalize font-heading tracking-tight">
                    <span className="hidden md:inline">{formattedDate}</span>
                    <span className="md:hidden">{format(currentDate, 'd MMM', { locale: uk })}</span>
                </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 animate-fade-in-down" style={{ animationDelay: '0.1s' }}>
                <ButtonGroup variant="ghost" size="sm">
                    {(['day', 'week', 'month'] as CalendarView[]).map((v) => (
                        <Button
                            key={v}
                            onClick={() => onViewChange(v)}
                            variant={view === v ? 'primary' : 'secondary'}
                        >
                            <span className="hidden sm:inline">
                                {v === 'day' && 'День'}
                                {v === 'week' && 'Тиждень'}
                                {v === 'month' && 'Місяць'}
                            </span>
                            <span className="sm:hidden">
                                {v === 'day' && 'Д'}
                                {v === 'week' && 'Т'}
                                {v === 'month' && 'М'}
                            </span>
                        </Button>
                    ))}
                </ButtonGroup>

                <div className="relative group hidden lg:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Пошук..."
                        className="pl-9 pr-4 py-2 w-64 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all shadow-sm group-hover:shadow-md"
                    />
                </div>

                <NotificationsDropdown
                    notifications={notifications}
                    onMarkAsRead={onMarkNotificationAsRead}
                    onMarkAllAsRead={onMarkAllNotificationsAsRead}
                    onDelete={onDeleteNotification}
                />

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
    );
}