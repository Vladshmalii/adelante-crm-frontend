'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { mockBookingStaff } from '../data/mockBooking';

interface BookingDateTimeStepProps {
    staffId?: string;
    selectedDate?: string;
    selectedTime?: string;
    onSelectDate: (date: string) => void;
    onSelectTime: (time: string) => void;
}

export function BookingDateTimeStep({
    staffId,
    selectedDate,
    selectedTime,
    onSelectDate,
    onSelectTime,
}: BookingDateTimeStepProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const staff = mockBookingStaff.find((s) => s.id === staffId);

    const dates = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startOffset = (firstDay.getDay() + 6) % 7;

        const days: (Date | null)[] = [];

        for (let i = 0; i < startOffset; i++) {
            days.push(null);
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    }, [currentMonth]);

    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
    const monthNames = [
        'Січень',
        'Лютий',
        'Березень',
        'Квітень',
        'Травень',
        'Червень',
        'Липень',
        'Серпень',
        'Вересень',
        'Жовтень',
        'Листопад',
        'Грудень',
    ];

    const isDateAvailable = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayOfWeek = date.getDay();
        return date >= today && dayOfWeek !== 0 && dayOfWeek !== 6;
    };

    const formatDateString = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="mb-2 text-xl font-semibold text-foreground">Оберіть дату і час</h2>
                <p className="text-muted-foreground">Виберіть зручний час для візиту</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl bg-muted/30 p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <button
                            onClick={handlePrevMonth}
                            className="rounded-lg p-2 transition-colors hover:bg-muted"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="font-medium">
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </span>
                        <button
                            onClick={handleNextMonth}
                            className="rounded-lg p-2 transition-colors hover:bg-muted"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {weekDays.map((day) => (
                            <div
                                key={day}
                                className="py-2 text-center text-sm font-medium text-muted-foreground"
                            >
                                {day}
                            </div>
                        ))}
                        {dates.map((date, index) => {
                            if (!date) {
                                return <div key={`empty-${index}`} />;
                            }

                            const dateStr = formatDateString(date);
                            const isSelected = selectedDate === dateStr;
                            const isAvailable = isDateAvailable(date);

                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => isAvailable && onSelectDate(dateStr)}
                                    disabled={!isAvailable}
                                    className={`flex aspect-square items-center justify-center rounded-lg text-sm transition-all ${
                                        isSelected
                                            ? 'bg-primary font-medium text-primary-foreground'
                                            : isAvailable
                                              ? 'text-foreground hover:bg-muted'
                                              : 'cursor-not-allowed text-muted-foreground/40'
                                    }`}
                                >
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <h3 className="mb-4 font-medium text-foreground">
                        {selectedDate
                            ? `Доступний час на ${new Date(selectedDate).toLocaleDateString('uk-UA')}`
                            : 'Оберіть дату для перегляду часу'}
                    </h3>
                    {selectedDate && staff && (
                        <div className="grid grid-cols-3 gap-2">
                            {staff.availableSlots.map((time: string) => {
                                const isSelected = selectedTime === time;
                                return (
                                    <button
                                        key={time}
                                        onClick={() => onSelectTime(time)}
                                        className={`rounded-lg border-2 p-3 text-center font-medium transition-all ${
                                            isSelected
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-border hover:border-primary/50'
                                        }`}
                                    >
                                        {time}
                                        {isSelected && <Check size={14} className="ml-1 inline" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {!selectedDate && (
                        <div className="rounded-xl bg-muted/30 py-8 text-center text-muted-foreground">
                            Спочатку оберіть дату
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
