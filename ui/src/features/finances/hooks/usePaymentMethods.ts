import { useState, useEffect, useCallback } from 'react';
import { financesApi, type CreatePaymentMethodPayload } from '@/lib/api/finances';
import { mockPaymentMethods } from '../data/mockPaymentMethods';
import { USE_MOCK_DATA } from '@/lib/config';
import type { PaymentMethod } from '../types';

export function usePaymentMethods() {
    const [methods, setMethods] = useState<PaymentMethod[]>(
        USE_MOCK_DATA ? mockPaymentMethods : [],
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (USE_MOCK_DATA) return;
        try {
            setIsLoading(true);
            setError(null);
            const data = await financesApi.getPaymentMethods();
            setMethods(data);
        } catch (err) {
            console.error('Failed to load payment methods:', err);
            setError(err instanceof Error ? err.message : 'Failed to load payment methods');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const createMethod = useCallback(async (data: CreatePaymentMethodPayload) => {
        if (USE_MOCK_DATA) {
            const newMethod: PaymentMethod = { ...data, id: `temp_${Date.now()}` };
            setMethods((prev) => [...prev, newMethod]);
            return newMethod;
        }
        const newMethod = await financesApi.createPaymentMethod(data);
        setMethods((prev) => [...prev, newMethod]);
        return newMethod;
    }, []);

    const updateMethod = useCallback(
        async (id: string | number, data: Partial<CreatePaymentMethodPayload>) => {
            if (USE_MOCK_DATA) {
                setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
                return;
            }
            const updated = await financesApi.updatePaymentMethod(String(id), data);
            setMethods((prev) =>
                prev.map((m) => (m.id.toString() === updated.id.toString() ? updated : m)),
            );
            return updated;
        },
        [],
    );

    return { methods, isLoading, error, load, createMethod, updateMethod };
}
