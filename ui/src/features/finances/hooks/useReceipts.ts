import { useState, useCallback } from 'react';
import { financesApi, type CreateReceiptPayload, type ReceiptFilters } from '@/lib/api/finances';
import { mockReceipts } from '../data/mockReceipts';
import { USE_MOCK_DATA } from '@/lib/config';
import type { FinanceReceipt } from '../types';

function toLocalReceipt(r: import('@/lib/api/finances').FinanceReceipt): FinanceReceipt {
    return {
        id: r.id,
        date: r.date,
        receiptNumber: r.number,
        cashRegister: r.cashRegister,
        client: r.client || '—',
        amount: r.amount,
        paymentMethod: r.paymentMethod,
        status: r.status,
        source: r.source,
        author: r.author,
    };
}

export function useReceipts() {
    const [receipts, setReceipts] = useState<FinanceReceipt[]>(USE_MOCK_DATA ? mockReceipts : []);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (filters?: ReceiptFilters) => {
        if (USE_MOCK_DATA) return;
        try {
            setIsLoading(true);
            setError(null);
            const data = await financesApi.getReceipts(filters);
            setReceipts(data.map(toLocalReceipt));
        } catch (err) {
            console.error('Failed to load receipts:', err);
            setError(err instanceof Error ? err.message : 'Failed to load receipts');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createReceipt = useCallback(async (data: CreateReceiptPayload) => {
        const newReceipt = await financesApi.createReceipt(data);
        const local = toLocalReceipt(newReceipt);
        setReceipts((prev) => [local, ...prev]);
        return local;
    }, []);

    const cancelReceipt = useCallback(async (id: string | number) => {
        const updated = await financesApi.cancelReceipt(String(id));
        const local = toLocalReceipt(updated);
        setReceipts((prev) =>
            prev.map((r) => (r.id.toString() === local.id.toString() ? local : r)),
        );
        return local;
    }, []);

    return { receipts, isLoading, error, load, createReceipt, cancelReceipt };
}
