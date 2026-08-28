import { useState, useEffect } from 'react';
import { useClientsStore } from '@/stores/useClientsStore';
import { clientsApi, type ClientWritePayload } from '@/lib/api/clients';
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
    const { clients, pagination, setClients, setPagination, setLoading, isLoading } =
        useClientsStore();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadClients();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options.search, options.segment, options.page, options.limit]);

    const loadClients = async () => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                let filtered = [...CLIENTS_MOCK].map((c) => {
                    const { visits, ...rest } = c;
                    return {
                        ...rest,
                        totalVisits: c.totalVisits ?? (typeof visits === 'number' ? visits : 0),
                        visits: Array.isArray(visits) ? visits : [],
                        bonusBalance: c.bonusBalance ?? 0,
                        createdAt: c.createdAt ?? c.firstVisit,
                    };
                });

                if (options.search) {
                    const search = options.search.toLowerCase();
                    filtered = filtered.filter(
                        (c) =>
                            c.firstName?.toLowerCase().includes(search) ||
                            c.lastName?.toLowerCase().includes(search) ||
                            c.phone?.toLowerCase().includes(search) ||
                            c.email?.toLowerCase().includes(search),
                    );
                }

                if (options.segment) {
                    filtered = filtered.filter((c) => c.segment === options.segment);
                }

                const perPage = options.limit || 50;
                const page = options.page || 1;
                const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

                setClients(pageItems);
                setPagination({
                    page,
                    perPage,
                    total: filtered.length,
                    totalPages: Math.max(1, Math.ceil(filtered.length / perPage)),
                });
            } else {
                const { items, meta } = await clientsApi.getAll({
                    search: options.search,
                    segment: options.segment,
                    page: options.page || 1,
                    perPage: options.limit || 50,
                });

                setClients(items);
                setPagination(meta);
            }
        } catch (err) {
            console.error('Failed to load clients:', err);
            setError(err instanceof Error ? err.message : 'Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    const createClient = async (data: ClientWritePayload) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
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
            }

            const newClient = await clientsApi.create(data);
            await loadClients();
            return newClient;
        } catch (err) {
            console.error('Failed to create client:', err);
            setError(err instanceof Error ? err.message : 'Failed to create client');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateClient = async (id: string | number, data: Partial<ClientWritePayload>) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                const updated = clients.map((c) => (c.id === id ? { ...c, ...data } : c));
                setClients(updated);
                return;
            }

            await clientsApi.update(String(id), data);
            await loadClients();
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
                setClients(clients.filter((c) => c.id !== id));
                return;
            }

            await clientsApi.delete(String(id));
            await loadClients();
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
        pagination,
        isLoading,
        error,
        loadClients,
        createClient,
        updateClient,
        deleteClient,
    };
}
