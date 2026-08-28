import { useState, useEffect } from 'react';
import { overviewApi } from '@/lib/api/overview';
import { MOCK_RECORDS } from '../data/mockRecords';
import { MOCK_REVIEWS } from '../data/mockReviews';
import { MOCK_CHANGES } from '../data/mockChanges';
import { USE_MOCK_DATA } from '@/lib/config';
import type {
    Record,
    RecordsFilters,
    Review,
    ReviewsFilters,
    Change,
    ChangesFilters,
} from '../types';

export function useOverviewRecords(filters: RecordsFilters) {
    const [records, setRecords] = useState<Record[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                if (USE_MOCK_DATA) {
                    if (!cancelled) setRecords(MOCK_RECORDS);
                } else {
                    const data = await overviewApi.getRecords(filters);
                    if (!cancelled) setRecords(data);
                }
            } catch (err) {
                console.error('Failed to load overview records:', err);
                if (!cancelled)
                    setError(err instanceof Error ? err.message : 'Failed to load records');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(filters)]);

    return { records, isLoading, error };
}

export function useOverviewReviews(filters: ReviewsFilters) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                if (USE_MOCK_DATA) {
                    if (!cancelled) setReviews(MOCK_REVIEWS);
                } else {
                    const data = await overviewApi.getReviews(filters);
                    if (!cancelled) setReviews(data);
                }
            } catch (err) {
                console.error('Failed to load reviews:', err);
                if (!cancelled)
                    setError(err instanceof Error ? err.message : 'Failed to load reviews');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(filters)]);

    return { reviews, isLoading, error };
}

export function useOverviewChanges(filters: ChangesFilters) {
    const [changes, setChanges] = useState<Change[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                if (USE_MOCK_DATA) {
                    if (!cancelled) setChanges(MOCK_CHANGES);
                } else {
                    const data = await overviewApi.getChanges(filters);
                    if (!cancelled) setChanges(data);
                }
            } catch (err) {
                console.error('Failed to load changes:', err);
                if (!cancelled)
                    setError(err instanceof Error ? err.message : 'Failed to load changes');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(filters)]);

    return { changes, isLoading, error };
}
