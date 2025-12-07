import { create } from 'zustand';
import { servicesApi, Service, ServiceFilters, CreateServiceRequest } from '@/lib/api/services';

interface ServicesState {
    services: Service[];
    selectedService: Service | null;
    isLoading: boolean;
    filters: ServiceFilters;

    fetchServices: (filters?: ServiceFilters) => Promise<void>;
    fetchServiceById: (id: string) => Promise<void>;
    createService: (data: CreateServiceRequest) => Promise<void>;
    updateService: (id: string, data: Partial<CreateServiceRequest>) => Promise<void>;
    deleteService: (id: string) => Promise<void>;
    setFilters: (filters: ServiceFilters) => void;
    selectService: (service: Service | null) => void;
}

export const useServicesStore = create<ServicesState>((set) => ({
    services: [],
    selectedService: null,
    isLoading: false,
    filters: {},

    fetchServices: async (filters) => {
        set({ isLoading: true });
        try {
            const response = await servicesApi.getAll(filters);
            set({ services: response.data || [] });
        } catch (error) {
            console.error('Failed to fetch services:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchServiceById: async (id) => {
        set({ isLoading: true });
        try {
            const service = await servicesApi.getById(id);
            set({ selectedService: service });
        } catch (error) {
            console.error(`Failed to fetch service with id ${id}:`, error);
        } finally {
            set({ isLoading: false });
        }
    },

    createService: async (data) => {
        set({ isLoading: true });
        try {
            const newService = await servicesApi.create(data);
            set((state) => ({ services: [...state.services, newService] }));
        } catch (error) {
            console.error('Failed to create service:', error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateService: async (id, data) => {
        set({ isLoading: true });
        try {
            const updatedService = await servicesApi.update(id, data);
            set((state) => ({
                services: state.services.map((s) => (s.id === id ? updatedService : s)),
                selectedService: state.selectedService?.id === id ? updatedService : state.selectedService
            }));
        } catch (error) {
            console.error(`Failed to update service with id ${id}:`, error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteService: async (id) => {
        set({ isLoading: true });
        try {
            await servicesApi.delete(id);
            set((state) => ({
                services: state.services.filter((s) => s.id !== id),
                selectedService: state.selectedService?.id === id ? null : state.selectedService
            }));
        } catch (error) {
            console.error(`Failed to delete service with id ${id}:`, error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    setFilters: (filters) => set({ filters }),
    selectService: (service) => set({ selectedService: service }),
}));
