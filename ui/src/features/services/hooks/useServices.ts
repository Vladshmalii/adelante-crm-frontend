import { useState, useEffect } from 'react';
import { useServicesStore } from '@/stores/useServicesStore';
import { servicesApi, type ServiceWritePayload } from '@/lib/api/services';
import { MOCK_SERVICES } from '../data/mockServices';
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options.search, options.category, options.isActive]);

    const loadServices = async () => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                let filtered = [...MOCK_SERVICES].map((s) => ({
                    ...s,
                    isActive: s.isActive ?? true,
                }));

                if (options.search) {
                    const search = options.search.toLowerCase();
                    filtered = filtered.filter((s) => s.name?.toLowerCase().includes(search));
                }
                if (options.category) {
                    filtered = filtered.filter((s) => s.category === options.category);
                }
                if (options.isActive !== undefined) {
                    filtered = filtered.filter((s) => s.isActive === options.isActive);
                }

                setServices(filtered);
            } else {
                const data = await servicesApi.getAll({
                    search: options.search,
                    category: options.category,
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

    const createService = async (data: ServiceWritePayload) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                const newService: Service = {
                    ...data,
                    id: Date.now(),
                    isActive: data.status !== 'inactive' && data.status !== 'archived',
                };
                setServices([...services, newService]);
                return newService;
            }

            const newService = await servicesApi.create(data);
            await loadServices();
            return newService;
        } catch (err) {
            console.error('Failed to create service:', err);
            setError(err instanceof Error ? err.message : 'Failed to create service');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateService = async (id: string | number, data: Partial<ServiceWritePayload>) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                setServices(services.map((s) => (s.id === id ? { ...s, ...data } : s)));
                return;
            }

            await servicesApi.update(String(id), data);
            await loadServices();
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
                setServices(services.filter((s) => s.id !== id));
                return;
            }

            await servicesApi.archive(String(id));
            await loadServices();
        } catch (err) {
            console.error('Failed to archive service:', err);
            setError(err instanceof Error ? err.message : 'Failed to archive service');
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
