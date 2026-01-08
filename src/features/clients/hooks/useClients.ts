import { useState, useEffect } from 'react';
import { useClientsStore } from '@/stores/useClientsStore';
import { clientsApi } from '@/lib/api/clients';
import { CLIENTS_MOCK } from '../data/mockClients';
import { USE_MOCK_DATA } from '@/lib/config';
import type { Client } from '../types';

interface UseClientsOptions {
    search?: string;
    segment?: string;
    page?: number;
    limit?: number;
}

export function useClients(options: UseClientsOptions = {}) {
    const { clients, setClients, setLoading, isLoading } = useClientsStore();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadClients();
    }, [options.search, options.segment, options.page]);

    const loadClients = async () => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Використовуємо мокові дані
                let filtered = [...CLIENTS_MOCK].map((c: any) => {
                    const { visits, ...rest } = c;
                    return {
                        ...rest,
                        totalVisits: c.totalVisits ?? (typeof visits === 'number' ? visits : 0),
                        visits: Array.isArray(visits) ? visits : [],
                        bonusBalance: c.bonusBalance ?? 0,
                        createdAt: c.createdAt ?? c.firstVisit,
                    };
                });

                // Фільтруємо по пошуку
                if (options.search) {
                    const search = options.search.toLowerCase();
                    filtered = filtered.filter(
                        (c) =>
                            c.firstName?.toLowerCase().includes(search) ||
                            c.lastName?.toLowerCase().includes(search) ||
                            c.phone?.toLowerCase().includes(search) ||
                            c.email?.toLowerCase().includes(search)
                    );
                }

                // Фільтруємо по сегменту
                if (options.segment) {
                    filtered = filtered.filter((c) => c.segment === options.segment);
                }

                // Імітуємо затримку мережі
                await new Promise((resolve) => setTimeout(resolve, 300));

                setClients(filtered);
            } else {
                // Використовуємо реальний API
                const data = await clientsApi.getAll({
                    search: options.search,
                    segment: options.segment,
                    page: options.page || 1,
                    perPage: options.limit || 50,
                });

                setClients(data);
            }
        } catch (err) {
            console.error('Failed to load clients:', err);
            setError(err instanceof Error ? err.message : 'Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    const createClient = async (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'totalVisits' | 'totalSpent' | 'segment'>) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова логіка створення
                const newClient: Client = {
                    ...data,
                    id: Date.now(),
                    totalVisits: 0,
                    totalSpent: 0,
                    segment: 'new',
                    createdAt: new Date().toISOString(),
                    bonusBalance: 0,
                };

                setClients([...clients, newClient]);
                return newClient;
            } else {
                // Реальний API
                const newClient = await clientsApi.create(data);
                setClients([...clients, newClient]);
                return newClient;
            }
        } catch (err) {
            console.error('Failed to create client:', err);
            setError(err instanceof Error ? err.message : 'Failed to create client');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateClient = async (id: string | number, data: Partial<Client>) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова логіка оновлення
                const updated = clients.map((c) =>
                    c.id === id ? { ...c, ...data } : c
                );
                setClients(updated);
            } else {
                // Реальний API
                const numId = typeof id === 'string' ? parseInt(id) : id;
                const updatedClient = await clientsApi.update(numId, data);
                const updated = clients.map((c) =>
                    c.id === updatedClient.id ? updatedClient : c
                );
                setClients(updated);
            }
        } catch (err) {
            console.error('Failed to update client:', err);
            setError(err instanceof Error ? err.message : 'Failed to update client');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteClient = async (id: string | number) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова логіка видалення
                const filtered = clients.filter((c) => c.id !== id);
                setClients(filtered);
            } else {
                // Реальний API
                const numId = typeof id === 'string' ? parseInt(id) : id;
                await clientsApi.delete(numId);
                const filtered = clients.filter((c) => c.id !== id);
                setClients(filtered);
            }
        } catch (err) {
            console.error('Failed to delete client:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete client');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        clients,
        isLoading,
        error,
        loadClients,
        createClient,
        updateClient,
        deleteClient,
    };
}

