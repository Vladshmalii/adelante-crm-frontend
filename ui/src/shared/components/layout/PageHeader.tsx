import { ReactNode } from 'react';
import { NotificationsDropdown, Notification } from '../ui/NotificationsDropdown';
import { ProfileDropdown } from '../ui/ProfileDropdown';
import { StaffRole } from '@/features/staff/types';

interface PageHeaderProps {
    title: string;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    searchPlaceholder?: string;
    actions?: ReactNode;
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

export function PageHeader({
    title,
    searchQuery,
    onSearchChange,
    searchPlaceholder = 'Пошук...',
    actions,
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
}: PageHeaderProps) {
    return (
        <div className="mb-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="font-heading text-2xl font-semibold text-foreground">{title}</h1>

                <div className="flex items-center gap-2">
                    {actions}

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

            {onSearchChange && (
                <div className="relative max-w-md">
                    <input
                        type="text"
                        value={searchQuery || ''}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full rounded-lg border border-border bg-background py-2.5 pl-4 pr-4 text-sm transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            )}
        </div>
    );
}
