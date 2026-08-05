'use client';

import { CheckCircle2, Calendar, Clock, User, MapPin, Phone } from 'lucide-react';
import { mockBookingServices, mockBookingStaff } from '../data/mockBooking';
import type { BookingFormData } from '../types';

interface BookingSuccessProps {
    formData: Partial<BookingFormData>;
    onNewBooking: () => void;
}

export function BookingSuccess({ formData, onNewBooking }: BookingSuccessProps) {
    const service = mockBookingServices.find((s) => s.id === formData.serviceId);
    const staff = mockBookingStaff.find((s) => s.id === formData.staffId);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('uk-UA', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
            <div className="w-full max-w-md">
                <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-2xl">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
                        <CheckCircle2 size={40} className="text-success" />
                    </div>

                    <h1 className="mb-2 text-2xl font-bold text-foreground">Запис підтверджено!</h1>
                    <p className="mb-8 text-muted-foreground">
                        Дякуємо за ваш запис. Ми надіслали SMS з деталями на ваш номер.
                    </p>

                    <div className="mb-8 space-y-4 rounded-2xl bg-muted/30 p-6 text-left">
                        <div className="flex items-center gap-3">
                            <Calendar size={20} className="text-primary" />
                            <div>
                                <p className="text-sm text-muted-foreground">Дата</p>
                                <p className="font-medium capitalize">
                                    {formatDate(formData.date)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Clock size={20} className="text-primary" />
                            <div>
                                <p className="text-sm text-muted-foreground">Час</p>
                                <p className="font-medium">{formData.time}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <User size={20} className="text-primary" />
                            <div>
                                <p className="text-sm text-muted-foreground">Майстер</p>
                                <p className="font-medium">{staff?.name}</p>
                            </div>
                        </div>

                        <div className="border-t border-border pt-3">
                            <p className="font-medium text-foreground">{service?.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {service?.duration} хв • {service?.price} ₴
                            </p>
                        </div>
                    </div>

                    <div className="mb-8 space-y-4">
                        <div className="flex items-center gap-3 rounded-xl bg-primary/5 p-4 text-left">
                            <MapPin size={20} className="flex-shrink-0 text-primary" />
                            <div>
                                <p className="text-sm text-muted-foreground">Адреса</p>
                                <p className="font-medium">вул. Хрещатик, 1, Київ</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-xl bg-primary/5 p-4 text-left">
                            <Phone size={20} className="flex-shrink-0 text-primary" />
                            <div>
                                <p className="text-sm text-muted-foreground">Телефон</p>
                                <p className="font-medium">+380 44 123 45 67</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onNewBooking}
                        className="w-full rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                    >
                        Зробити новий запис
                    </button>
                </div>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    © 2025 Adelante CRM. Усі права захищено.
                </p>
            </div>
        </div>
    );
}
