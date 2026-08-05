'use client';

import { useState } from 'react';
import { Calendar, Clock, User, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { BookingServiceStep } from './BookingServiceStep';
import { BookingStaffStep } from './BookingStaffStep';
import { BookingDateTimeStep } from './BookingDateTimeStep';
import { BookingDetailsStep } from './BookingDetailsStep';
import { BookingConfirmStep } from './BookingConfirmStep';
import { BookingSuccess } from './BookingSuccess';
import type { BookingStep, BookingFormData } from '../types';

const steps: { id: BookingStep; label: string; icon: any }[] = [
    { id: 'service', label: 'Послуга', icon: Calendar },
    { id: 'staff', label: 'Майстер', icon: User },
    { id: 'datetime', label: 'Дата і час', icon: Clock },
    { id: 'details', label: 'Ваші дані', icon: User },
    { id: 'confirm', label: 'Підтвердження', icon: Check },
];

interface BookingLayoutProps {
    isWidget?: boolean;
}

export function BookingLayout({ isWidget = false }: BookingLayoutProps) {
    const [currentStep, setCurrentStep] = useState<BookingStep>('service');
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState<Partial<BookingFormData>>({});

    const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

    // ... handlers ...
    const handleNext = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < steps.length) {
            setCurrentStep(steps[nextIndex].id);
        }
    };

    const handleBack = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex].id);
        }
    };

    const handleConfirm = () => {
        console.log('Booking confirmed:', formData);
        setIsSuccess(true);
    };

    const handleReset = () => {
        setFormData({});
        setCurrentStep('service');
        setIsSuccess(false);
    };

    const updateFormData = (data: Partial<BookingFormData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    if (isSuccess) {
        return <BookingSuccess formData={formData} onNewBooking={handleReset} />;
    }

    return (
        <div
            className={`min-h-screen ${isWidget ? 'bg-background' : 'bg-gradient-to-br from-primary/5 via-background to-accent/5'}`}
        >
            <div className="mx-auto max-w-3xl px-4 py-8">
                <div className="mb-8 text-center">
                    <h1 className="mb-2 text-3xl font-bold text-foreground">Онлайн запис</h1>
                    <p className="text-muted-foreground">
                        Оберіть послугу та зручний час для візиту
                    </p>
                </div>

                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = index === currentStepIndex;
                            const isCompleted = index < currentStepIndex;

                            return (
                                <div key={step.id} className="flex flex-1 items-center">
                                    <div className="flex w-full flex-col items-center">
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                                                isCompleted
                                                    ? 'bg-primary text-primary-foreground'
                                                    : isActive
                                                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                                                      : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                                        </div>
                                        <span
                                            className={`mt-2 hidden text-xs sm:block ${
                                                isActive
                                                    ? 'font-medium text-primary'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            {step.label}
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div
                                            className={`mx-2 h-0.5 flex-1 ${
                                                index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                                            }`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
                    {currentStep === 'service' && (
                        <BookingServiceStep
                            selectedId={formData.serviceId}
                            onSelect={(id) => updateFormData({ serviceId: id })}
                        />
                    )}
                    {currentStep === 'staff' && (
                        <BookingStaffStep
                            serviceId={formData.serviceId}
                            selectedId={formData.staffId}
                            onSelect={(id) => updateFormData({ staffId: id })}
                        />
                    )}
                    {currentStep === 'datetime' && (
                        <BookingDateTimeStep
                            staffId={formData.staffId}
                            selectedDate={formData.date}
                            selectedTime={formData.time}
                            onSelectDate={(date) => updateFormData({ date })}
                            onSelectTime={(time) => updateFormData({ time })}
                        />
                    )}
                    {currentStep === 'details' && (
                        <BookingDetailsStep data={formData} onUpdate={updateFormData} />
                    )}
                    {currentStep === 'confirm' && <BookingConfirmStep formData={formData} />}

                    <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                        <button
                            onClick={handleBack}
                            disabled={currentStepIndex === 0}
                            className="flex items-center gap-2 px-4 py-2 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ArrowLeft size={18} />
                            Назад
                        </button>

                        {currentStep === 'confirm' ? (
                            <button
                                onClick={handleConfirm}
                                disabled={!formData.clientName || !formData.clientPhone}
                                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Check size={18} />
                                Підтвердити запис
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                disabled={
                                    (currentStep === 'service' && !formData.serviceId) ||
                                    (currentStep === 'staff' && !formData.staffId) ||
                                    (currentStep === 'datetime' &&
                                        (!formData.date || !formData.time)) ||
                                    (currentStep === 'details' &&
                                        (!formData.clientName || !formData.clientPhone))
                                }
                                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Далі
                                <ArrowRight size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {!isWidget && (
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        © 2025 Adelante CRM. Усі права захищено.
                    </p>
                )}
            </div>
        </div>
    );
}
