import { useState, useCallback } from 'react';

interface PaginationOptions {
    initialPage?: number;
    initialItemsPerPage?: number;
    totalItems: number;
}

interface PaginationResult {
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
    offset: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    setPage: (page: number) => void;
    setItemsPerPage: (count: number) => void;
    nextPage: () => void;
    previousPage: () => void;
    goToFirstPage: () => void;
    goToLastPage: () => void;
}

export function usePagination({
    initialPage = 1,
    initialItemsPerPage = 10,
    totalItems,
}: PaginationOptions): PaginationResult {
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);

    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const offset = (currentPage - 1) * itemsPerPage;
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;

    const setPage = useCallback((page: number) => {
        const safePage = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(safePage);
    }, [totalPages]);

    const setItemsPerPage = useCallback((count: number) => {
        setItemsPerPageState(count);
        setCurrentPage(1);
    }, []);

    const nextPage = useCallback(() => {
        if (hasNextPage) {
            setCurrentPage(prev => prev + 1);
        }
    }, [hasNextPage]);

    const previousPage = useCallback(() => {
        if (hasPreviousPage) {
            setCurrentPage(prev => prev - 1);
        }
    }, [hasPreviousPage]);

    const goToFirstPage = useCallback(() => {
        setCurrentPage(1);
    }, []);

    const goToLastPage = useCallback(() => {
        setCurrentPage(totalPages);
    }, [totalPages]);

    return {
        currentPage,
        itemsPerPage,
        totalPages,
        offset,
        hasNextPage,
        hasPreviousPage,
        setPage,
        setItemsPerPage,
        nextPage,
        previousPage,
        goToFirstPage,
        goToLastPage,
    };
}
