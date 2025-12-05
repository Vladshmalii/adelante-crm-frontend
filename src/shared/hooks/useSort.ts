import { useState, useCallback } from 'react';

type SortDirection = 'asc' | 'desc';

interface SortConfig<T> {
    key: keyof T;
    direction: SortDirection;
}

interface UseSortOptions<T> {
    defaultSort?: SortConfig<T>;
    multiSort?: boolean;
}

interface UseSortResult<T> {
    sortConfigs: SortConfig<T>[];
    sortBy: (key: keyof T) => void;
    setSortDirection: (key: keyof T, direction: SortDirection) => void;
    clearSort: () => void;
    getSortDirection: (key: keyof T) => SortDirection | null;
    isSorted: (key: keyof T) => boolean;
    sortData: (data: T[]) => T[];
}

export function useSort<T extends Record<string, any>>({
    defaultSort,
    multiSort = false,
}: UseSortOptions<T> = {}): UseSortResult<T> {
    const [sortConfigs, setSortConfigs] = useState<SortConfig<T>[]>(
        defaultSort ? [defaultSort] : []
    );

    const sortBy = useCallback((key: keyof T) => {
        setSortConfigs(prev => {
            const existingIndex = prev.findIndex(config => config.key === key);

            if (existingIndex >= 0) {
                const existing = prev[existingIndex];
                if (existing.direction === 'asc') {
                    const newConfigs = [...prev];
                    newConfigs[existingIndex] = { key, direction: 'desc' };
                    return newConfigs;
                } else {
                    return prev.filter((_, i) => i !== existingIndex);
                }
            }

            if (multiSort) {
                return [...prev, { key, direction: 'asc' }];
            }
            return [{ key, direction: 'asc' }];
        });
    }, [multiSort]);

    const setSortDirection = useCallback((key: keyof T, direction: SortDirection) => {
        setSortConfigs(prev => {
            const existingIndex = prev.findIndex(config => config.key === key);

            if (existingIndex >= 0) {
                const newConfigs = [...prev];
                newConfigs[existingIndex] = { key, direction };
                return newConfigs;
            }

            if (multiSort) {
                return [...prev, { key, direction }];
            }
            return [{ key, direction }];
        });
    }, [multiSort]);

    const clearSort = useCallback(() => {
        setSortConfigs([]);
    }, []);

    const getSortDirection = useCallback((key: keyof T): SortDirection | null => {
        const config = sortConfigs.find(c => c.key === key);
        return config?.direction ?? null;
    }, [sortConfigs]);

    const isSorted = useCallback((key: keyof T): boolean => {
        return sortConfigs.some(c => c.key === key);
    }, [sortConfigs]);

    const sortData = useCallback((data: T[]): T[] => {
        if (sortConfigs.length === 0) return data;

        return [...data].sort((a, b) => {
            for (const config of sortConfigs) {
                const aVal = a[config.key];
                const bVal = b[config.key];

                let comparison = 0;
                if (aVal < bVal) comparison = -1;
                if (aVal > bVal) comparison = 1;

                if (comparison !== 0) {
                    return config.direction === 'desc' ? -comparison : comparison;
                }
            }
            return 0;
        });
    }, [sortConfigs]);

    return {
        sortConfigs,
        sortBy,
        setSortDirection,
        clearSort,
        getSortDirection,
        isSorted,
        sortData,
    };
}
