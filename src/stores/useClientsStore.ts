import { create } from 'zustand';

import type { Client, Visit } from '@/features/clients/types';

interface ClientFilters {
    search?: string;
    segment?: string;
}

interface PaginationMeta {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
}

interface ClientsState {
    clients: Client[];
    selectedClient: Client | null;
    isLoading: boolean;
    filters: ClientFilters;
    pagination: PaginationMeta;

    setClients: (clients: Client[]) => void;
    addClient: (client: Client) => void;
    updateClient: (id: string | number, data: Partial<Client>) => void;
    deleteClient: (id: string | number) => void;
    addVisit: (clientId: string | number, visit: Visit) => void;
    selectClient: (client: Client | null) => void;
    setFilters: (filters: ClientFilters) => void;
    setPagination: (pagination: PaginationMeta) => void;
    setLoading: (isLoading: boolean) => void;
}

export const useClientsStore = create<ClientsState>((set) => ({
    clients: [],
    selectedClient: null,
    isLoading: false,
    filters: {},
    pagination: { page: 1, perPage: 10, total: 0, totalPages: 0 },

    setClients: (clients) => set({ clients }),

    addClient: (client) =>
        set((state) => ({
            clients: [...state.clients, client],
        })),

    updateClient: (id, data) =>
        set((state) => ({
            clients: state.clients.map((c) =>
                c.id.toString() === id.toString() ? { ...c, ...data } : c
            ),
        })),

    deleteClient: (id) =>
        set((state) => ({
            clients: state.clients.filter((c) => c.id.toString() !== id.toString()),
        })),

    addVisit: (clientId, visit) =>
        set((state) => ({
            clients: state.clients.map((c) =>
                c.id.toString() === clientId.toString()
                    ? {
                        ...c,
                        visits: [visit, ...(c.visits || [])],
                        totalVisits: (c.totalVisits || 0) + 1,
                        lastVisit: visit.date
                    }
                    : c
            ),
        })),

    selectClient: (client) => set({ selectedClient: client }),

    setFilters: (filters) => set({ filters }),

    setPagination: (pagination) => set({ pagination }),

    setLoading: (isLoading) => set({ isLoading }),
}));
