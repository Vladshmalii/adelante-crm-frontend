'use client';

import { CheckCircle2, Calendar, Clock, User, MapPin, Phone } from 'lucide-react';
import { mockBookingServices, mockBookingStaff } from '../data/mockBooking';
import type { BookingFormData } from '../types';

interface BookingSuccessProps {
    formData: Partial<BookingFormData>;
    onNewBooking: () => void;
}

export function BookingSuccess({ formData, onNewBooking }: BookingSuccessProps) {
    const service = mockBookingServices.find(s => s.id === formData.serviceId);
    const staff = mockBookingStaff.find(s => s.id === formData.staffId);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('uk-UA', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-card rounded-3xl shadow-2xl border border-border p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} className="text-success" />
                    </div>

                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Запис підтверджено!
                    </h1>
                    <p className="text-muted-foreground mb-8">
                        Дякуємо за ваш запис. Ми надіслали SMS з деталями на ваш номер.
                    </p>

                    <div className="bg-muted/30 rounded-2xl p-6 text-left space-y-4 mb-8">
                        <div className="flex items-center gap-3">
                            <Calendar size={20} className="text-primary" />
                            <div>
                                <p className="text-sm text-muted-foreground">Дата</p>
                                <p className="font-medium capitalize">{formatDate(formData.date)}</p>
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

                        <div className="pt-3 border-t border-border">
                            <p className="font-medium text-foreground">{service?.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {service?.duration} хв • {service?.price} ₴
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 text-left p-4 bg-primary/5 rounded-xl">
                            <MapPin size={20} className="text-primary flex-shrink-0" />
                            <div>
                                <p className="text-sm text-muted-foreground">Адреса</p>
                                <p className="font-medium">вул. Хрещатик, 1, Київ</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-left p-4 bg-primary/5 rounded-xl">
                            <Phone size={20} className="text-primary flex-shrink-0" />
                            <div>
                                <p className="text-sm text-muted-foreground">Телефон</p>
                                <p className="font-medium">+380 44 123 45 67</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onNewBooking}
                        className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-colors font-medium"
                    >
                        Зробити новий запис
                    </button>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    © 2025 Adelante CRM. Усі права захищено.
                </p>
            </div>
        </div>
    );
}
