import { useState, useEffect } from 'react';
import { useServicesStore } from '@/stores/useServicesStore';
import { servicesApi } from '@/lib/api/services';
import { mockServices } from '../data/mockServices';
import { USE_MOCK_DATA } from '@/lib/config';
import type { Service } from '../types';

interface UseServicesOptions {
    search?: string;
    category?: string;
    isActive?: boolean;
}

export function useServices(options: UseServicesOptions = {}) {
    const { services, setServices, setLoading, isLoading } = useServicesStore();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadServices();
    }, [options.search, options.category, options.isActive]);

    const loadServices = async () => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Використовуємо мокові дані
                let filtered = [...mockServices].map((s: any) => ({
                    ...s,
                    id: s.id,
                    isActive: s.isActive ?? true,
                }));

                // Фільтруємо по пошуку
                if (options.search) {
                    const search = options.search.toLowerCase();
                    filtered = filtered.filter((s) =>
                        s.name?.toLowerCase().includes(search)
                    );
                }

                // Фільтруємо по категорії
                if (options.category) {
                    filtered = filtered.filter((s) => s.category === options.category);
                }

                // Фільтруємо по статусу
                if (options.isActive !== undefined) {
                    filtered = filtered.filter((s) => s.isActive === options.isActive);
                }

                // Імітуємо затримку мережі
                await new Promise((resolve) => setTimeout(resolve, 300));

                setServices(filtered);
            } else {
                // Використовуємо реальний API
                const data = await servicesApi.getAll({
                    search: options.search,
                    category: options.category,
                    isActive: options.isActive,
                });

                setServices(data);
            }
        } catch (err) {
            console.error('Failed to load services:', err);
            setError(err instanceof Error ? err.message : 'Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const createService = async (data: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова логіка створення
                const newService: Service = {
                    ...data,
                    id: Date.now(),
                    createdAt: new Date().toISOString(),
                    isActive: data.isActive ?? true,
                };

                setServices([...services, newService]);
                return newService;
            } else {
                // Реальний API
                const newService = await servicesApi.create(data);
                setServices([...services, newService]);
                return newService;
            }
        } catch (err) {
            console.error('Failed to create service:', err);
            setError(err instanceof Error ? err.message : 'Failed to create service');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateService = async (id: string | number, data: Partial<Service>) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова логіка оновлення
                const updated = services.map((s) =>
                    s.id === id ? { ...s, ...data } : s
                );
                setServices(updated);
            } else {
                // Реальний API
                const numId = typeof id === 'string' ? parseInt(id) : id;
                const updatedService = await servicesApi.update(numId, data);
                const updated = services.map((s) =>
                    s.id === updatedService.id ? updatedService : s
                );
                setServices(updated);
            }
        } catch (err) {
            console.error('Failed to update service:', err);
            setError(err instanceof Error ? err.message : 'Failed to update service');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteService = async (id: string | number) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова логіка видалення
                const filtered = services.filter((s) => s.id !== id);
                setServices(filtered);
            } else {
                // Реальний API
                const numId = typeof id === 'string' ? parseInt(id) : id;
                await servicesApi.delete(numId);
                const filtered = services.filter((s) => s.id !== id);
                setServices(filtered);
            }
        } catch (err) {
            console.error('Failed to delete service:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete service');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        services,
        isLoading,
        error,
        loadServices,
        createService,
        updateService,
        deleteService,
    };
}

