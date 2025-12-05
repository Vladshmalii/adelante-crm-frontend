'use client';

import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { mockBookingServices, SERVICE_CATEGORIES } from '../data/mockBooking';

interface BookingServiceStepProps {
    selectedId?: string;
    onSelect: (id: string) => void;
}

export function BookingServiceStep({ selectedId, onSelect }: BookingServiceStepProps) {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const groupedServices = useMemo(() => {
        const grouped: Record<string, typeof mockBookingServices> = {};
        mockBookingServices.forEach(service => {
            if (!grouped[service.category]) {
                grouped[service.category] = [];
            }
            grouped[service.category].push(service);
        });
        return grouped;
    }, []);

    const filteredServices = activeCategory
        ? { [activeCategory]: groupedServices[activeCategory] }
        : groupedServices;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                    Оберіть послугу
                </h2>
                <p className="text-muted-foreground">
                    Виберіть послугу, яку бажаєте отримати
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setActiveCategory(null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === null
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                >
                    Усі
                </button>
                {SERVICE_CATEGORIES.map(category => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === category
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {Object.entries(filteredServices).map(([category, services]) => (
                    <div key={category}>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">
                            {category}
                        </h3>
                        <div className="grid gap-3">
                            {services.map(service => {
                                const isSelected = selectedId === service.id;
                                return (
                                    <button
                                        key={service.id}
                                        onClick={() => onSelect(service.id)}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${isSelected
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-foreground">
                                                {service.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {service.duration} хв
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-foreground">
                                                {service.price} ₴
                                            </span>
                                            {isSelected && (
                                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                                    <Check size={14} className="text-primary-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
