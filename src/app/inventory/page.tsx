'use client';

import { AppShell } from '@/shared/components/layout/AppShell';
import { FeatureHeader } from '@/shared/components/layout/FeatureHeader';
import { useHeaderActions } from '@/shared/hooks/useHeaderActions';
import { ProfileModal } from '@/features/profile/modals/ProfileModal';
import { InventoryLayout } from '@/features/inventory/components/InventoryLayout';

export default function InventoryPage() {
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
        <AppShell activeSection="inventory">
            <div className="h-full flex flex-col">
                <FeatureHeader
                    title="Склад"
                    subtitle="Облік товарів та матеріалів"
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
                <div className="flex-1 overflow-auto">
                    <InventoryLayout />
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
