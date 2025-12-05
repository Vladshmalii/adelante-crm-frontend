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

export function BookingLayout() {
    const [currentStep, setCurrentStep] = useState<BookingStep>('service');
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState<Partial<BookingFormData>>({});

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

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
        setFormData(prev => ({ ...prev, ...data }));
    };

    if (isSuccess) {
        return <BookingSuccess formData={formData} onNewBooking={handleReset} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Онлайн запис
                    </h1>
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
                                <div key={step.id} className="flex-1 flex items-center">
                                    <div className="flex flex-col items-center w-full">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCompleted
                                                    ? 'bg-primary text-primary-foreground'
                                                    : isActive
                                                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                                                        : 'bg-muted text-muted-foreground'
                                                }`}
                                        >
                                            {isCompleted ? (
                                                <Check size={20} />
                                            ) : (
                                                <Icon size={20} />
                                            )}
                                        </div>
                                        <span className={`text-xs mt-2 hidden sm:block ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                                            }`}>
                                            {step.label}
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-2 ${index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                                            }`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-card rounded-2xl shadow-xl border border-border p-6 sm:p-8">
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
                        <BookingDetailsStep
                            data={formData}
                            onUpdate={updateFormData}
                        />
                    )}
                    {currentStep === 'confirm' && (
                        <BookingConfirmStep
                            formData={formData}
                        />
                    )}

                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                        <button
                            onClick={handleBack}
                            disabled={currentStepIndex === 0}
                            className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ArrowLeft size={18} />
                            Назад
                        </button>

                        {currentStep === 'confirm' ? (
                            <button
                                onClick={handleConfirm}
                                disabled={!formData.clientName || !formData.clientPhone}
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
                                    (currentStep === 'datetime' && (!formData.date || !formData.time)) ||
                                    (currentStep === 'details' && (!formData.clientName || !formData.clientPhone))
                                }
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                Далі
                                <ArrowRight size={18} />
                            </button>
                        )}
                    </div>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    © 2025 Adelante CRM. Усі права захищено.
                </p>
            </div>
        </div>
    );
}
