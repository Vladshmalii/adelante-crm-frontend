'use client';

import { useState } from 'react';
import { ServicesHeader } from './ServicesHeader';
import { ServicesFilters } from './ServicesFilters';
import { ServiceCard } from './ServiceCard';
import { AddServiceModal } from '../modals/AddServiceModal';
import { EditServiceModal } from '../modals/EditServiceModal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { MOCK_SERVICES } from '../data/mockServices';
import type { Service, ServiceFilters, AddServiceFormData } from '../types';

export function ServicesLayout() {
    const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<ServiceFilters>({});
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    const handleAddService = (data: AddServiceFormData) => {
        const newService: Service = {
            id: Date.now().toString(),
            ...data,
        };
        setServices([...services, newService]);
    };

    const handleEditService = (id: string, data: AddServiceFormData) => {
        setServices(services.map(service =>
            service.id === id ? { ...service, ...data } : service
        ));
    };

    const handleDeleteService = () => {
        if (selectedService) {
            setServices(services.filter(service => service.id !== selectedService.id));
            setSelectedService(null);
        }
    };

    const handleServiceClick = (service: Service) => {
        setSelectedService(service);
        setIsEditModalOpen(true);
    };

    const filteredServices = services.filter(service => {
        if (searchQuery && !service.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (filters.category && service.category !== filters.category) {
            return false;
        }
        if (filters.status && service.status !== filters.status) {
            return false;
        }
        if (filters.priceFrom && service.price < filters.priceFrom) {
            return false;
        }
        if (filters.priceTo && service.price > filters.priceTo) {
            return false;
        }
        return true;
    });

    return (
        <div className="p-6">
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
