import { useState, useEffect } from 'react';
import { useFinancesStore } from '@/stores/useFinancesStore';
import { financesApi } from '@/lib/api/finances';
import { mockOperations } from '../data/mockOperations';
import { mockDocuments } from '../data/mockDocuments';
import { USE_MOCK_DATA } from '@/lib/config';

interface UseFinancesOptions {
    dateFrom?: string;
    dateTo?: string;
    type?: string;
    category?: string;
}

export function useFinances(options: UseFinancesOptions = {}) {
    const { operations, documents, setOperations, setDocuments, setLoading, isLoading } = useFinancesStore();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadOperations();
    }, [options.dateFrom, options.dateTo, options.type, options.category]);

    const loadOperations = async () => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Використовуємо мокові дані
                let filtered = [...mockOperations].map((o: any) => ({
                    ...o,
                    id: o.id,
                }));

                // Фільтруємо по датах
                if (options.dateFrom) {
                    filtered = filtered.filter((o) => o.date >= options.dateFrom!);
                }
                if (options.dateTo) {
                    filtered = filtered.filter((o) => o.date <= options.dateTo!);
                }

                // Фільтруємо по типу
                if (options.type) {
                    filtered = filtered.filter((o) => o.type === options.type);
                }

                // Фільтруємо по категорії
                if (options.category) {
                    filtered = filtered.filter((o) => o.category === options.category);
                }

                // Імітуємо затримку мережі
                await new Promise((resolve) => setTimeout(resolve, 300));

                setOperations(filtered);
            } else {
                // Використовуємо реальний API
                const data = await financesApi.getOperations({
                    dateFrom: options.dateFrom,
                    dateTo: options.dateTo,
                    type: options.type,
                    category: options.category,
                });

                setOperations(data);
            }
        } catch (err) {
            console.error('Failed to load operations:', err);
            setError(err instanceof Error ? err.message : 'Failed to load operations');
        } finally {
            setLoading(false);
        }
    };

    const loadDocuments = async (filters?: any) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Використовуємо мокові дані
                let filtered = [...mockDocuments];

                // Фільтруємо по типу
                if (filters?.type) {
                    filtered = filtered.filter((d) => d.type === filters.type);
                }

                // Фільтруємо по статусу
                if (filters?.status) {
                    filtered = filtered.filter((d) => d.status === filters.status);
                }

                // Імітуємо затримку мережі
                await new Promise((resolve) => setTimeout(resolve, 300));

                setDocuments(filtered);
            } else {
                // Використовуємо реальний API
                const data = await financesApi.getDocuments(filters);
                setDocuments(data);
            }
        } catch (err) {
            console.error('Failed to load documents:', err);
            setError(err instanceof Error ? err.message : 'Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const createOperation = async (data: any) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова логіка створення
                const newOperation = {
                    ...data,
                    id: Date.now(),
                    createdAt: new Date().toISOString(),
                };

                setOperations([...operations, newOperation]);
                return newOperation;
            } else {
                // Реальний API
                const newOperation = await financesApi.createOperation(data);
                setOperations([...operations, newOperation]);
                return newOperation;
            }
        } catch (err) {
            console.error('Failed to create operation:', err);
            setError(err instanceof Error ? err.message : 'Failed to create operation');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createDocument = async (data: any) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова логіка створення
                const newDocument = {
                    ...data,
                    id: Date.now(),
                    createdAt: new Date().toISOString(),
                };

                setDocuments([...documents, newDocument]);
                return newDocument;
            } else {
                // Реальний API
                const newDocument = await financesApi.createDocument(data);
                setDocuments([...documents, newDocument]);
                return newDocument;
            }
        } catch (err) {
            console.error('Failed to create document:', err);
            setError(err instanceof Error ? err.message : 'Failed to create document');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getDashboard = async (dateFrom: string, dateTo: string) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокові дані для дашборду
                await new Promise((resolve) => setTimeout(resolve, 300));
                
                return {
                    totalRevenue: 125000,
                    totalExpenses: 45000,
                    netIncome: 80000,
                    revenueByDay: [],
                    expensesByCategory: [],
                    topServices: [],
                };
            } else {
                // Реальний API
                return await financesApi.getDashboard({ dateFrom, dateTo });
            }
        } catch (err) {
            console.error('Failed to load dashboard:', err);
            setError(err instanceof Error ? err.message : 'Failed to load dashboard');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        operations,
        documents,
        isLoading,
        error,
        loadOperations,
        loadDocuments,
        createOperation,
        createDocument,
        getDashboard,
    };
}

