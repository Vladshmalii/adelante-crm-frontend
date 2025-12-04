'use client';

import { AppShell } from '@/shared/components/layout/AppShell';
import { FeatureHeader } from '@/shared/components/layout/FeatureHeader';
import { useHeaderActions } from '@/shared/hooks/useHeaderActions';
import { ProfileModal } from '@/features/profile/modals/ProfileModal';
import { ServicesLayout } from '@/features/services/components/ServicesLayout';

export default function ServicesPage() {
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
		<AppShell activeSection="services">
			<div className="h-full flex flex-col">
				<FeatureHeader
					title="Послуги"
					subtitle="Управління послугами салону"
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
					<ServicesLayout />
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
