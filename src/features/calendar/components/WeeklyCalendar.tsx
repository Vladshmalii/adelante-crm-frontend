'use client';

import { useState } from 'react';
import { StaffMember, Appointment } from '../types';
import { format, startOfWeek, addDays } from 'date-fns';
import { uk } from 'date-fns/locale';
import clsx from 'clsx';

interface WeeklyCalendarProps {
    currentDate: Date;
    staff: StaffMember[];
    appointments: Appointment[];
    selectedStaffIds: string[];
    onAppointmentClick: (appointment: Appointment) => void;
}

export function WeeklyCalendar({
    currentDate,
    staff,
    appointments,
    selectedStaffIds,
    onAppointmentClick,
}: WeeklyCalendarProps) {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const filteredStaff = staff.filter(s => selectedStaffIds.includes(s.id));

    const getAppointmentsForDayAndStaff = (date: Date, staffId: string) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return appointments.filter(
            apt => apt.date === dateStr && apt.staffId === staffId
        );
    };

    return (
        <div className="h-full overflow-auto">
            <div className="min-w-[800px]">
                <div className="grid" style={{ gridTemplateColumns: `200px repeat(7, 1fr)` }}>
                    <div className="sticky left-0 z-10 bg-muted/30 border-b border-r border-border p-3">
                        <span className="text-sm font-medium text-muted-foreground">Майстер</span>
                    </div>
                    {weekDays.map((day) => {
                        const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                        return (
                            <div
                                key={day.toISOString()}
                                className={clsx(
                                    'border-b border-r border-border p-3 text-center',
                                    isToday ? 'bg-primary/10' : 'bg-muted/30'
                                )}
                            >
                                <div className="text-xs text-muted-foreground uppercase">
                                    {format(day, 'EEE', { locale: uk })}
                                </div>
                                <div className={clsx(
                                    'text-lg font-semibold',
                                    isToday && 'text-primary'
                                )}>
                                    {format(day, 'd')}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredStaff.map((staffMember) => (
                    <div
                        key={staffMember.id}
                        className="grid"
                        style={{ gridTemplateColumns: `200px repeat(7, 1fr)` }}
                    >
                        <div className="sticky left-0 z-10 bg-background border-b border-r border-border p-3">
                            <div className="font-medium text-sm truncate">{staffMember.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{staffMember.role}</div>
                        </div>
                        {weekDays.map((day) => {
                            const dayAppointments = getAppointmentsForDayAndStaff(day, staffMember.id);
                            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={clsx(
                                        'border-b border-r border-border p-2 min-h-[100px]',
                                        isToday && 'bg-primary/5'
                                    )}
                                >
                                    <div className="space-y-1">
                                        {dayAppointments.map((apt) => (
                                            <button
                                                key={apt.id}
                                                onClick={() => onAppointmentClick(apt)}
                                                className={clsx(
                                                    'w-full text-left p-2 rounded-lg text-xs transition-all hover:scale-[1.02]',
                                                    apt.type === 'important' && 'bg-amber-500/20 border border-amber-500/30 text-amber-700',
                                                    apt.type === 'special' && 'bg-purple-500/20 border border-purple-500/30 text-purple-700',
                                                    apt.type === 'standard' && 'bg-primary/10 border border-primary/20 text-primary'
                                                )}
                                            >
                                                <div className="font-medium truncate">
                                                    {apt.startTime} - {apt.service}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
