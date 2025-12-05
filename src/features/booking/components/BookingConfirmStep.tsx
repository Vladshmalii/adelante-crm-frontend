'use client';

import { Calendar, Clock, User, Briefcase } from 'lucide-react';
import { mockBookingServices, mockBookingStaff } from '../data/mockBooking';
import type { BookingFormData } from '../types';

interface BookingConfirmStepProps {
    formData: Partial<BookingFormData>;
}

export function BookingConfirmStep({ formData }: BookingConfirmStepProps) {
    const service = mockBookingServices.find(s => s.id === formData.serviceId);
    const staff = mockBookingStaff.find(s => s.id === formData.staffId);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('uk-UA', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                    Підтвердження запису
                </h2>
                <p className="text-muted-foreground">
                    Перевірте деталі вашого запису
                </p>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Briefcase size={24} className="text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Послуга</p>
                        <p className="font-medium text-foreground">{service?.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {service?.duration} хв • {service?.price} ₴
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <User size={24} className="text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Майстер</p>
                        <p className="font-medium text-foreground">{staff?.name}</p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Calendar size={24} className="text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Дата</p>
                        <p className="font-medium text-foreground capitalize">
                            {formatDate(formData.date)}
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Clock size={24} className="text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Час</p>
                        <p className="font-medium text-foreground">{formData.time}</p>
                    </div>
                </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                <h3 className="font-medium text-foreground">Ваші дані</h3>
                <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Ім&apos;я:</span>
                        <span className="font-medium">{formData.clientName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Телефон:</span>
                        <span className="font-medium">{formData.clientPhone}</span>
                    </div>
                    {formData.clientEmail && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-medium">{formData.clientEmail}</span>
                        </div>
                    )}
                    {formData.comment && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Коментар:</span>
                            <span className="font-medium text-right max-w-[200px]">{formData.comment}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 bg-warning/10 rounded-xl border border-warning/20">
                <p className="text-sm text-warning-foreground">
                    Будь ласка, прийдіть за 10-15 хвилин до початку сеансу.
                    При скасуванні запису попередьте не менше ніж за 2 години.
                </p>
            </div>
        </div>
    );
}
