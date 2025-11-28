'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/shared/components/layout/AppShell';
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

export default function OverviewPage() {
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'records';

    const [recordsFilters, setRecordsFilters] = useState<RecordsFiltersType>({});
    const [reviewsFilters, setReviewsFilters] = useState<ReviewsFiltersType>({});
    const [changesFilters, setChangesFilters] = useState<ChangesFiltersType>({});

    return (
        <AppShell activeSection="overview">
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-foreground">Огляд</h1>
                </div>

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
        </AppShell>
    );
}