import { useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface UseFilterOptions<T> {
    defaultFilters?: T;
    syncWithUrl?: boolean;
}

interface UseFilterResult<T> {
    filters: T;
    setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
    setFilters: (newFilters: Partial<T>) => void;
    resetFilters: () => void;
    clearFilter: (key: keyof T) => void;
    hasActiveFilters: boolean;
    activeFilterCount: number;
}

export function useFilter<T extends Record<string, any>>({
    defaultFilters = {} as T,
    syncWithUrl = false,
}: UseFilterOptions<T> = {}): UseFilterResult<T> {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const getInitialFilters = (): T => {
        if (!syncWithUrl) return defaultFilters;

        const urlFilters: Record<string, any> = {};
        searchParams.forEach((value, key) => {
            if (key in defaultFilters) {
                urlFilters[key] = value;
            }
        });

        return { ...defaultFilters, ...urlFilters };
    };

    const [filters, setFiltersState] = useState<T>(getInitialFilters);

    const updateUrl = useCallback((newFilters: T) => {
        if (!syncWithUrl) return;

        const params = new URLSearchParams();
        Object.entries(newFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.set(key, String(value));
            }
        });

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [syncWithUrl, pathname, router]);

    const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
        setFiltersState(prev => {
            const newFilters = { ...prev, [key]: value };
            updateUrl(newFilters);
            return newFilters;
        });
    }, [updateUrl]);

    const setFilters = useCallback((newFilters: Partial<T>) => {
        setFiltersState(prev => {
            const updated = { ...prev, ...newFilters };
            updateUrl(updated);
            return updated;
        });
    }, [updateUrl]);

    const resetFilters = useCallback(() => {
        setFiltersState(defaultFilters);
        updateUrl(defaultFilters);
    }, [defaultFilters, updateUrl]);

    const clearFilter = useCallback((key: keyof T) => {
        setFiltersState(prev => {
            const newFilters = { ...prev };
            delete newFilters[key];
            if (key in defaultFilters) {
                newFilters[key] = defaultFilters[key];
            }
            updateUrl(newFilters);
            return newFilters;
        });
    }, [defaultFilters, updateUrl]);

    const { hasActiveFilters, activeFilterCount } = useMemo(() => {
        let count = 0;
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '' && value !== defaultFilters[key]) {
                count++;
            }
        });
        return { hasActiveFilters: count > 0, activeFilterCount: count };
    }, [filters, defaultFilters]);

    return {
        filters,
        setFilter,
        setFilters,
        resetFilters,
        clearFilter,
        hasActiveFilters,
        activeFilterCount,
    };
}
