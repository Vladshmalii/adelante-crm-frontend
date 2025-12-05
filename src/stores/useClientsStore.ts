import { create } from 'zustand';

interface Client {
    id: string;
    firstName: string;
    lastName?: string;
    middleName?: string;
    phone: string;
    email?: string;
    segment: 'new' | 'repeat' | 'lost';
    totalVisits: number;
    totalSpent: number;
}

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
    updateClient: (id: string, data: Partial<Client>) => void;
    deleteClient: (id: string) => void;
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
                c.id === id ? { ...c, ...data } : c
            ),
        })),

    deleteClient: (id) =>
        set((state) => ({
            clients: state.clients.filter((c) => c.id !== id),
        })),

    selectClient: (client) => set({ selectedClient: client }),

    setFilters: (filters) => set({ filters }),

    setPagination: (pagination) => set({ pagination }),

    setLoading: (isLoading) => set({ isLoading }),
}));
