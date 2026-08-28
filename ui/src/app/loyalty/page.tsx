'use client';

import { Suspense } from 'react';
import { AppShell } from '@/shared/components/layout/AppShell';
import { FeatureHeader } from '@/shared/components/layout/FeatureHeader';
import { useHeaderActions } from '@/shared/hooks/useHeaderActions';
import { ProfileModal } from '@/features/profile/modals/ProfileModal';
import { LoyaltyLayout } from '@/features/loyalty/components/LoyaltyLayout';

export default function LoyaltyPage() {
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
        <AppShell activeSection="loyalty">
            <div className="h-full flex flex-col">
                <FeatureHeader
                    title="Лояльність"
                    subtitle="Управління бонусними програмами та знижками"
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
                <div className="flex-1 overflow-hidden">
                    <Suspense fallback={<div>Завантаження...</div>}>
                        <LoyaltyLayout />
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
