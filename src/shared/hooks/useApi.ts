import { useState, useCallback } from 'react';

interface UseApiOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
}

interface UseApiResult<T, P extends any[] = any[]> {
    data: T | null;
    error: Error | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    execute: (...params: P) => Promise<T | null>;
    reset: () => void;
    retry: () => Promise<T | null>;
}

export function useApi<T, P extends any[] = any[]>(
    apiFunction: (...params: P) => Promise<T>,
    options: UseApiOptions<T> = {}
): UseApiResult<T, P> {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastParams, setLastParams] = useState<P | null>(null);

    const { onSuccess, onError } = options;

    const execute = useCallback(async (...params: P): Promise<T | null> => {
        setIsLoading(true);
        setError(null);
        setLastParams(params);

        try {
            const result = await apiFunction(...params);
            setData(result);
            onSuccess?.(result);
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [apiFunction, onSuccess, onError]);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setIsLoading(false);
        setLastParams(null);
    }, []);

    const retry = useCallback(async (): Promise<T | null> => {
        if (lastParams) {
            return execute(...lastParams);
        }
        return null;
    }, [execute, lastParams]);

    return {
        data,
        error,
        isLoading,
        isSuccess: !!data && !error,
        isError: !!error,
        execute,
        reset,
        retry,
    };
}
