'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/shared/components/layout/AppShell';
import { FeatureHeader } from '@/shared/components/layout/FeatureHeader';
import { useHeaderActions } from '@/shared/hooks/useHeaderActions';
import { ProfileModal } from '@/features/profile/modals/ProfileModal';
import { RecordsFilters } from '@/features/overview/components/records/RecordsFilters';
import { RecordsTable } from '@/features/overview/components/records/RecordsTable';
import { ReviewsFilters } from '@/features/overview/components/reviews/ReviewsFilters';
import { ReviewsList } from '@/features/overview/components/reviews/ReviewsList';
import { ChangesFilters } from '@/features/overview/components/changes/ChangesFilters';
import { ChangesTable } from '@/features/overview/components/changes/ChangesTable';
import { MOCK_RECORDS } from '@/features/overview/data/mockRecords';
import { MOCK_REVIEWS } from '@/features/overview/data/mockReviews';
import { MOCK_CHANGES } from '@/features/overview/data/mockChanges';
import type { RecordsFilters as RecordsFiltersType, ReviewsFilters as ReviewsFiltersType, ChangesFilters as ChangesFiltersType } from '@/features/overview/types';

function OverviewContent() {
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'records';

    const [recordsFilters, setRecordsFilters] = useState<RecordsFiltersType>({});
    const [reviewsFilters, setReviewsFilters] = useState<ReviewsFiltersType>({});
    const [changesFilters, setChangesFilters] = useState<ChangesFiltersType>({});

    return (
        <div className="p-6">
            {activeTab === 'records' && (
                <div>
                    <RecordsFilters
                        filters={recordsFilters}
                        onFiltersChange={setRecordsFilters}
                    />
                    <RecordsTable records={MOCK_RECORDS} />
                </div>
            )}

            {activeTab === 'reviews' && (
                <div>
                    <ReviewsFilters
                        filters={reviewsFilters}
                        onFiltersChange={setReviewsFilters}
                    />
                    <ReviewsList reviews={MOCK_REVIEWS} />
                </div>
            )}

            {activeTab === 'changes' && (
                <div>
                    <ChangesFilters
                        filters={changesFilters}
                        onFiltersChange={setChangesFilters}
                    />
                    <ChangesTable changes={MOCK_CHANGES} />
                </div>
            )}
        </div>
    );
}

export default function OverviewPage() {
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
        <AppShell activeSection="overview">
            <FeatureHeader
                title="Огляд"
                subtitle="Загальний огляд записів, відгуків та змін"
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

            <Suspense fallback={<div className="p-6 animate-pulse"><div className="h-64 bg-muted rounded-xl"></div></div>}>
                <OverviewContent />
            </Suspense>

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                profile={userProfile}
                onSave={handleSaveProfile}
            />
        </AppShell>
    );
}
