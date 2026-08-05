'use client';

import { Calendar, Clock, User, Briefcase } from 'lucide-react';
import { mockBookingServices, mockBookingStaff } from '../data/mockBooking';
import type { BookingFormData } from '../types';

interface BookingConfirmStepProps {
    formData: Partial<BookingFormData>;
}

export function BookingConfirmStep({ formData }: BookingConfirmStepProps) {
    const service = mockBookingServices.find((s) => s.id === formData.serviceId);
    const staff = mockBookingStaff.find((s) => s.id === formData.staffId);

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
                <h2 className="mb-2 text-xl font-semibold text-foreground">Підтвердження запису</h2>
                <p className="text-muted-foreground">Перевірте деталі вашого запису</p>
            </div>

            <div className="space-y-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/20">
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
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/20">
                        <User size={24} className="text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Майстер</p>
                        <p className="font-medium text-foreground">{staff?.name}</p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/20">
                        <Calendar size={24} className="text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Дата</p>
                        <p className="font-medium capitalize text-foreground">
                            {formatDate(formData.date)}
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/20">
                        <Clock size={24} className="text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Час</p>
                        <p className="font-medium text-foreground">{formData.time}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3 rounded-xl bg-muted/30 p-4">
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
                            <span className="max-w-[200px] text-right font-medium">
                                {formData.comment}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-xl border border-warning/20 bg-warning/10 p-4">
                <p className="text-sm text-warning-foreground">
                    Будь ласка, прийдіть за 10-15 хвилин до початку сеансу. При скасуванні запису
                    попередьте не менше ніж за 2 години.
                </p>
            </div>
        </div>
    );
}
