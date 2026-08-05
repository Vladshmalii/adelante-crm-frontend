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
    const service = mockBookingServices.find((s) => s.id === serviceId);

    const availableStaff = useMemo(() => {
        if (!service) return [];
        return mockBookingStaff.filter((staff) => staff.specializations.includes(service.category));
    }, [service]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="mb-2 text-xl font-semibold text-foreground">Оберіть майстра</h2>
                <p className="text-muted-foreground">
                    Виберіть майстра для послуги &quot;{service?.name}&quot;
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {availableStaff.map((staff) => {
                    const isSelected = selectedId === staff.id;
                    return (
                        <button
                            key={staff.id}
                            onClick={() => onSelect(staff.id)}
                            className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                                isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                            }`}
                        >
                            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                                <User size={24} className="text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-foreground">{staff.name}</p>
                                <p className="truncate text-sm text-muted-foreground">
                                    {staff.specializations.join(', ')}
                                </p>
                            </div>
                            {isSelected && (
                                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                                    <Check size={14} className="text-primary-foreground" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {availableStaff.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                    Немає доступних майстрів для обраної послуги
                </div>
            )}
        </div>
    );
}
