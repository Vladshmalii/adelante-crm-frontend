import { useState, useEffect, useCallback } from 'react';
import { financesApi, type CreateCashRegisterPayload } from '@/lib/api/finances';
import { mockCashRegisters } from '../data/mockCashRegisters';
import { USE_MOCK_DATA } from '@/lib/config';
import type { CashRegister } from '../types';

export function useCashRegisters() {
    const [registers, setRegisters] = useState<CashRegister[]>(
        USE_MOCK_DATA ? mockCashRegisters : [],
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (USE_MOCK_DATA) return;
        try {
            setIsLoading(true);
            setError(null);
            const data = await financesApi.getCashRegisters();
            setRegisters(data);
        } catch (err) {
            console.error('Failed to load cash registers:', err);
            setError(err instanceof Error ? err.message : 'Failed to load cash registers');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const createRegister = useCallback(async (data: CreateCashRegisterPayload) => {
        if (USE_MOCK_DATA) {
            const newRegister: CashRegister = {
                ...data,
                id: `temp_${Date.now()}`,
                location: data.location ?? '',
                balance: 0,
                isActive: data.isActive ?? true,
            };
            setRegisters((prev) => [...prev, newRegister]);
            return newRegister;
        }
        const newRegister = await financesApi.createCashRegister(data);
        setRegisters((prev) => [...prev, newRegister]);
        return newRegister;
    }, []);

    return { registers, isLoading, error, load, createRegister };
}
