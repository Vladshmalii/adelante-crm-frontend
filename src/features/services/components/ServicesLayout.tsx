'use client';

import { useState, useEffect, useMemo } from 'react';
import { ServicesHeader } from './ServicesHeader';
import { ServicesFilters } from './ServicesFilters';
import { ServiceCard } from './ServiceCard';
import { AddServiceModal } from '../modals/AddServiceModal';
import { EditServiceModal } from '../modals/EditServiceModal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import type { Service, ServiceFilters, AddServiceFormData } from '../types';
import { useServices } from '../hooks/useServices';
import { useToast } from '@/shared/hooks/useToast';
import { GlobalLoader } from '@/shared/components/ui/GlobalLoader';

export function ServicesLayout() {
    const toast = useToast();
    const { services, isLoading, error, createService, updateService, deleteService } = useServices();
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<ServiceFilters>({});
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [isLocalLoading, setIsLocalLoading] = useState(false);

    useEffect(() => {
        if (error) {
            toast.error('Помилка', error);
        }
    }, [error, toast]);

    const mapStatusToActive = (status: AddServiceFormData['status']) => status === 'active';

    const handleAddService = async (data: AddServiceFormData) => {
        setIsLocalLoading(true);
        try {
            const newServiceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'> = {
                name: data.name,
                category: data.category,
                description: data.description,
                duration: data.duration,
                price: data.price,
                color: data.color,
                isActive: mapStatusToActive(data.status),
            };
            await createService(newServiceData);
            toast.success('Послугу створено', 'Успіх');
            setIsAddModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error('Помилка', err instanceof Error ? err.message : 'Не вдалося створити послугу');
        } finally {
            setIsLocalLoading(false);
        }
    };

    const handleEditService = async (id: string | number, data: AddServiceFormData) => {
        if (!selectedService) return;
        setIsLocalLoading(true);
        try {
            const payload: Partial<Service> = {
                name: data.name,
                category: data.category,
                description: data.description,
                duration: data.duration,
                price: data.price,
                color: data.color,
                isActive: mapStatusToActive(data.status),
            };
            await updateService(id, payload);
            toast.success('Послугу оновлено', 'Успіх');
            setIsEditModalOpen(false);
            setSelectedService(null);
        } catch (err) {
            console.error(err);
            toast.error('Помилка', err instanceof Error ? err.message : 'Не вдалося оновити послугу');
        } finally {
            setIsLocalLoading(false);
        }
    };

    const handleDeleteService = async () => {
        if (!selectedService) return;
        setIsLocalLoading(true);
        try {
            await deleteService(selectedService.id);
            toast.success('Послугу видалено', 'Успіх');
            setSelectedService(null);
        } catch (err) {
            console.error(err);
            toast.error('Помилка', err instanceof Error ? err.message : 'Не вдалося видалити послугу');
        } finally {
            setIsLocalLoading(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const handleServiceClick = (service: Service) => {
        setSelectedService(service);
        setIsEditModalOpen(true);
    };

    const filteredServices = useMemo(() => services.filter(service => {
        if (searchQuery && !service.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (filters.category && service.category !== filters.category) {
            return false;
        }
        if (filters.status) {
            if (filters.status === 'active' && !service.isActive) return false;
            if (filters.status !== 'active' && service.status && service.status !== filters.status) return false;
        }
        if (filters.priceFrom && service.price < filters.priceFrom) {
            return false;
        }
        if (filters.priceTo && service.price > filters.priceTo) {
            return false;
        }
        return true;
    }), [services, filters, searchQuery]);

    return (
        <div className="p-4 sm:p-6">
            <GlobalLoader isLoading={isLoading || isLocalLoading} />

            <ServicesHeader
                onAddService={() => setIsAddModalOpen(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            <ServicesFilters
                filters={filters}
                onFiltersChange={setFilters}
            />

            <div className="mt-6">
                {filteredServices.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Послуги не знайдено</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredServices.map(service => (
                            <ServiceCard
                                key={service.id}
                                service={service}
                                onClick={() => handleServiceClick(service)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <AddServiceModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleAddService}
            />

            <EditServiceModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedService(null);
                }}
                onSave={handleEditService}
                onDelete={() => {
                    setIsEditModalOpen(false);
                    setIsDeleteDialogOpen(true);
                }}
                service={selectedService}
            />

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDeleteService}
                title="Видалити послугу?"
                message={`Ви впевнені, що хочете видалити послугу "${selectedService?.name}"? Цю дію неможливо скасувати.`}
                confirmText="Видалити"
                cancelText="Скасувати"
                variant="danger"
            />
        </div>
    );
}
