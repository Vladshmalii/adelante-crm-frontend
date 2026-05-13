'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/shared/components/layout/AppShell';
import { FeatureHeader } from '@/shared/components/layout/FeatureHeader';
import { useHeaderActions } from '@/shared/hooks/useHeaderActions';
import { ProfileModal } from '@/features/profile/modals/ProfileModal';
import { Button } from '@/shared/components/ui/Button';
import { RecordsFilters } from '@/features/overview/components/records/RecordsFilters';
import { RecordsTable } from '@/features/overview/components/records/RecordsTable';
import { ReviewsFilters } from '@/features/overview/components/reviews/ReviewsFilters';
import { ReviewsList } from '@/features/overview/components/reviews/ReviewsList';
import { ChangesFilters } from '@/features/overview/components/changes/ChangesFilters';
import { ChangesTable } from '@/features/overview/components/changes/ChangesTable';
import { RecordDetailsModal } from '@/features/overview/modals/RecordDetailsModal';
import { ReviewDetailsModal } from '@/features/overview/modals/ReviewDetailsModal';
import { ChangeDetailsModal } from '@/features/overview/modals/ChangeDetailsModal';
import { MOCK_RECORDS } from '@/features/overview/data/mockRecords';
import { MOCK_REVIEWS } from '@/features/overview/data/mockReviews';
import { MOCK_CHANGES } from '@/features/overview/data/mockChanges';
import type { Record, Review, Change, RecordsFilters as RecordsFiltersType, ReviewsFilters as ReviewsFiltersType, ChangesFilters as ChangesFiltersType } from '@/features/overview/types';

function OverviewContent() {
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'records';

    const [recordsFilters, setRecordsFilters] = useState<RecordsFiltersType>({});
    const [reviewsFilters, setReviewsFilters] = useState<ReviewsFiltersType>({});
    const [changesFilters, setChangesFilters] = useState<ChangesFiltersType>({});

    // Modals State
    const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    const [selectedChange, setSelectedChange] = useState<Change | null>(null);
    const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

    const handleViewRecord = (record: Record) => {
        setSelectedRecord(record);
        setIsRecordModalOpen(true);
    };

    const handleViewReview = (review: Review) => {
        setSelectedReview(review);
        setIsReviewModalOpen(true);
    };

    const handleViewChange = (change: Change) => {
        setSelectedChange(change);
        setIsChangeModalOpen(true);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] min-h-0">
            {activeTab === 'records' && (
                <div className="flex flex-col h-full min-h-0">
                    <div className="px-6 py-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold font-heading">Записи</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 pb-10 custom-scrollbar">
                        <RecordsFilters
                            filters={recordsFilters}
                            onFiltersChange={setRecordsFilters}
                        />
                        <RecordsTable 
                            records={MOCK_RECORDS} 
                            onView={handleViewRecord}
                        />
                    </div>
                </div>
            )}

            {activeTab === 'reviews' && (
                <div className="flex flex-col h-full min-h-0">
                    <div className="px-6 py-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold font-heading">Відгуки</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 pb-10 custom-scrollbar">
                        <ReviewsFilters
                            filters={reviewsFilters}
                            onFiltersChange={setReviewsFilters}
                        />
                        <ReviewsList 
                            reviews={MOCK_REVIEWS} 
                            onView={handleViewReview}
                        />
                    </div>
                </div>
            )}

            {activeTab === 'changes' && (
                <div className="flex flex-col h-full min-h-0">
                    <div className="px-6 py-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold font-heading">Зміни даних</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 pb-10 custom-scrollbar">
                        <ChangesFilters
                            filters={changesFilters}
                            onFiltersChange={setChangesFilters}
                        />
                        <ChangesTable 
                            changes={MOCK_CHANGES} 
                            onView={handleViewChange}
                        />
                    </div>
                </div>
            )}

            {/* Modals */}
            <RecordDetailsModal
                isOpen={isRecordModalOpen}
                onClose={() => setIsRecordModalOpen(false)}
                record={selectedRecord}
            />

            <ReviewDetailsModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                review={selectedReview}
            />

            <ChangeDetailsModal
                isOpen={isChangeModalOpen}
                onClose={() => setIsChangeModalOpen(false)}
                change={selectedChange}
            />
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
