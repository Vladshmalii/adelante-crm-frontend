'use client';

import { useMemo } from 'react';
import { Check, User } from 'lucide-react';
import { mockBookingStaff, mockBookingServices } from '../data/mockBooking';

interface BookingStaffStepProps {
    serviceId?: string;
    selectedId?: string;
    onSelect: (id: string) => void;
}

export function BookingStaffStep({ serviceId, selectedId, onSelect }: BookingStaffStepProps) {
    const service = mockBookingServices.find(s => s.id === serviceId);

    const availableStaff = useMemo(() => {
        if (!service) return [];
        return mockBookingStaff.filter(staff =>
            staff.specializations.includes(service.category)
        );
    }, [service]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                    Оберіть майстра
                </h2>
                <p className="text-muted-foreground">
                    Виберіть майстра для послуги &quot;{service?.name}&quot;
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {availableStaff.map(staff => {
                    const isSelected = selectedId === staff.id;
                    return (
                        <button
                            key={staff.id}
                            onClick={() => onSelect(staff.id)}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                }`}
                        >
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                                <User size={24} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">
                                    {staff.name}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                    {staff.specializations.join(', ')}
                                </p>
                            </div>
                            {isSelected && (
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                    <Check size={14} className="text-primary-foreground" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {availableStaff.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    Немає доступних майстрів для обраної послуги
                </div>
            )}
        </div>
    );
}
