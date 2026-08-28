'use client';

import { Suspense } from 'react';
import { AppShell } from '@/shared/components/layout/AppShell';
import { FeatureHeader } from '@/shared/components/layout/FeatureHeader';
import { useHeaderActions } from '@/shared/hooks/useHeaderActions';
import { ProfileModal } from '@/features/profile/modals/ProfileModal';
import { SettingsContent } from './SettingsContent';

export default function SettingsPage() {
    const {
        notifications,
        isProfileModalOpen,
        setIsProfileModalOpen,
        handleMarkNotificationAsRead,
        handleMarkAllNotificationsAsRead,
        handleDeleteNotification,
        handleProfileClick,
        handleSettingsClick,
        handleLogout,
        handleSaveProfile,
        userProfile,
    } = useHeaderActions();

    return (
        <AppShell activeSection="settings">
            <div className="h-full flex flex-col">
                <FeatureHeader
                    title="Налаштування"
                    subtitle="Керування салоном, профілем та доступами"
                    notifications={notifications}
                    onMarkNotificationAsRead={handleMarkNotificationAsRead}
                    onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
                    onDeleteNotification={handleDeleteNotification}
                    userName={`${userProfile.firstName} ${userProfile.lastName}`}
                    userRole={userProfile.role}
                    userAvatar={userProfile.avatar}
                    onProfileClick={handleProfileClick}
                    onSettingsClick={handleSettingsClick}
                    onLogout={handleLogout}
                />

                <div className="flex-1 overflow-auto p-6">
                    <Suspense fallback={<div>Loading...</div>}>
                        <SettingsContent />
                    </Suspense>
                </div>
            </div>

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                profile={userProfile}
                onSave={handleSaveProfile}
            />
        </AppShell>
    );
}
