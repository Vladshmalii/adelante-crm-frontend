import { ReactNode } from 'react';
import { NotificationsDropdown, Notification } from '@/shared/components/ui/NotificationsDropdown';
import { ProfileDropdown } from '@/shared/components/ui/ProfileDropdown';
import { Breadcrumbs } from '@/shared/components/ui/Breadcrumbs';
import { StaffRole } from '@/features/staff/types';

interface FeatureHeaderProps {
    title: string;
    subtitle?: string;
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

export function FeatureHeader({
    title,
    subtitle,
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
}: FeatureHeaderProps) {
    return (
        <div className="p-4 sm:p-6 border-b border-border bg-card">
            <Breadcrumbs className="mb-4" />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground font-heading">{title}</h1>
                    {subtitle && (
                        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                    )}
                </div>

                <div className="flex items-center gap-3">
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
        </div>
    );
}
