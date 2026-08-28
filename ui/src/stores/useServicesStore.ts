import { create } from 'zustand';
import type { ServiceFilters } from '@/lib/api/services';
import type { Service } from '@/features/services/types';

interface ServicesState {
    services: Service[];
    selectedService: Service | null;
    isLoading: boolean;
    filters: ServiceFilters;

    setFilters: (filters: ServiceFilters) => void;
    selectService: (service: Service | null) => void;
    setServices: (services: Service[]) => void;
    setLoading: (isLoading: boolean) => void;
}

export const useServicesStore = create<ServicesState>((set) => ({
    services: [],
    selectedService: null,
    isLoading: false,
    filters: {},

    setFilters: (filters) => set({ filters }),
    selectService: (service) => set({ selectedService: service }),
    setServices: (services) => set({ services }),
    setLoading: (isLoading) => set({ isLoading }),
}));
