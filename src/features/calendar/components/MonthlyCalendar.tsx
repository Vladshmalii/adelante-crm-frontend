'use client';

import { useState } from 'react';
import { StaffMember, Appointment } from '../types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';
import { uk } from 'date-fns/locale';
import clsx from 'clsx';

interface MonthlyCalendarProps {
    currentDate: Date;
    staff: StaffMember[];
    appointments: Appointment[];
    selectedStaffIds: string[];
    onAppointmentClick: (appointment: Appointment) => void;
    onDayClick: (date: Date) => void;
}

interface DayDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    appointments: Appointment[];
    staff: StaffMember[];
    onAppointmentClick: (appointment: Appointment) => void;
}

function DayDetailsModal({
    isOpen,
    onClose,
    date,
    appointments,
    staff,
    onAppointmentClick,
}: DayDetailsModalProps) {
    if (!isOpen) return null;

    const getStaffName = (staffId: string) => {
        return staff.find(s => s.id === staffId)?.name || 'Невідомий';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-card border border-border rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-border">
                    <h3 className="text-lg font-semibold font-heading">
                        {format(date, 'd MMMM yyyy', { locale: uk })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {appointments.length} записів
                    </p>
                </div>
                <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
                    {appointments.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            Немає записів на цей день
                        </p>
                    ) : (
                        appointments.map((apt) => (
                            <button
                                key={apt.id}
                                onClick={() => {
                                    onAppointmentClick(apt);
                                    onClose();
                                }}
                                className={clsx(
                                    'w-full text-left p-3 rounded-lg transition-all hover:scale-[1.01]',
                                    apt.type === 'important' && 'bg-amber-500/10 border border-amber-500/30',
                                    apt.type === 'special' && 'bg-purple-500/10 border border-purple-500/30',
                                    apt.type === 'standard' && 'bg-primary/5 border border-primary/20'
                                )}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm">{apt.startTime} - {apt.endTime}</span>
                                    <span className="text-xs text-muted-foreground">{getStaffName(apt.staffId)}</span>
                                </div>
                                <div className="text-sm">{apt.clientName}</div>
                                <div className="text-xs text-muted-foreground">{apt.service}</div>
                            </button>
                        ))
                    )}
                </div>
                <div className="p-4 border-t border-border">
                    <button
                        onClick={onClose}
                        className="w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Закрити
                    </button>
                </div>
            </div>
        </div>
    );
}

export function MonthlyCalendar({
    currentDate,
    staff,
    appointments,
    selectedStaffIds,
    onAppointmentClick,
    onDayClick,
}: MonthlyCalendarProps) {
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [showDayDetails, setShowDayDetails] = useState(false);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
        days.push(day);
        day = addDays(day, 1);
    }

    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    const filteredStaff = staff.filter(s => selectedStaffIds.includes(s.id));

    const getAppointmentsForDay = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return appointments.filter(
            apt => apt.date === dateStr && selectedStaffIds.includes(apt.staffId)
        );
    };

    const getAppointmentsByStaff = (dayAppointments: Appointment[]) => {
        const grouped: Record<string, Appointment[]> = {};
        dayAppointments.forEach(apt => {
            if (!grouped[apt.staffId]) {
                grouped[apt.staffId] = [];
            }
            grouped[apt.staffId].push(apt);
        });
        return grouped;
    };

    const handleDayClick = (day: Date, dayAppointments: Appointment[]) => {
        if (dayAppointments.length > 0) {
            setSelectedDay(day);
            setShowDayDetails(true);
        } else {
            onDayClick(day);
        }
    };

    const getStaffName = (staffId: string) => {
        return staff.find(s => s.id === staffId)?.name || 'Невідомий';
    };

    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

    return (
        <>
            <div className="h-full overflow-auto p-4">
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="grid grid-cols-7 border-b border-border">
                        {weekDays.map((dayName) => (
                            <div
                                key={dayName}
                                className="p-3 text-center text-sm font-medium text-muted-foreground bg-muted/30"
                            >
                                {dayName}
                            </div>
                        ))}
                    </div>

                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="grid grid-cols-7">
                            {week.map((day) => {
                                const isCurrentMonth = isSameMonth(day, currentDate);
                                const isToday = isSameDay(day, new Date());
                                const dayAppointments = getAppointmentsForDay(day);
                                const appointmentsByStaff = getAppointmentsByStaff(dayAppointments);
                                const staffWithAppointments = Object.keys(appointmentsByStaff);

                                return (
                                    <div
                                        key={day.toISOString()}
                                        onClick={() => handleDayClick(day, dayAppointments)}
                                        className={clsx(
                                            'min-h-[120px] p-2 border-b border-r border-border cursor-pointer transition-colors',
                                            !isCurrentMonth && 'bg-muted/20 opacity-50',
                                            isToday && 'bg-primary/5',
                                            'hover:bg-accent/30'
                                        )}
                                    >
                                        <div className={clsx(
                                            'text-sm font-medium mb-2',
                                            isToday && 'text-primary',
                                            !isCurrentMonth && 'text-muted-foreground'
                                        )}>
                                            {format(day, 'd')}
                                        </div>
                                        <div className="space-y-1">
                                            {staffWithAppointments.slice(0, 3).map((staffId) => {
                                                const count = appointmentsByStaff[staffId].length;
                                                return (
                                                    <div
                                                        key={staffId}
                                                        className="text-xs p-1.5 rounded bg-primary/10 text-primary truncate"
                                                    >
                                                        {getStaffName(staffId)} — {count} записів
                                                    </div>
                                                );
                                            })}
                                            {staffWithAppointments.length > 3 && (
                                                <div className="text-xs text-muted-foreground text-center">
                                                    +{staffWithAppointments.length - 3} ще
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <DayDetailsModal
                isOpen={showDayDetails}
                onClose={() => {
                    setShowDayDetails(false);
                    setSelectedDay(null);
                }}
                date={selectedDay || new Date()}
                appointments={selectedDay ? getAppointmentsForDay(selectedDay) : []}
                staff={staff}
                onAppointmentClick={onAppointmentClick}
            />
        </>
    );
}
