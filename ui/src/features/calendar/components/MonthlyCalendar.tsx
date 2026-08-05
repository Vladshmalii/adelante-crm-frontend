'use client';

import { useState } from 'react';
import { StaffMember, Appointment } from '../types';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameMonth,
    isSameDay,
} from 'date-fns';
import { uk } from 'date-fns/locale';
import { X, Calendar as CalendarIcon, User, Clock, CheckCircle } from 'lucide-react';
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

    const getStaffInfo = (staffId?: string) => {
        if (!staffId || staffId === 'unassigned') return { name: 'Без майстра', role: 'Черга' };
        const s = staff.find((s) => s.id.toString() === staffId.toString());
        return s ? { name: s.name, role: s.role } : { name: 'Невідомий', role: '' };
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 animate-fade-in bg-background/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative flex max-h-[85vh] w-full max-w-lg animate-scale-in flex-col overflow-hidden rounded-[2.5rem] border border-border/10 bg-card shadow-2xl">
                {/* Header */}
                <div className="relative border-b border-border/10 bg-muted/20 p-8">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-border/10 bg-background shadow-lg transition-all hover:scale-110 hover:bg-muted active:scale-95"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                    <div className="mb-2 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                            <CalendarIcon className="h-6 w-6" />
                        </div>
                        <h3 className="font-heading text-2xl font-bold tracking-tight">
                            {format(date, 'd MMMM yyyy', { locale: uk })}
                        </h3>
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                        {appointments.length} записів на цей день
                    </div>
                </div>

                {/* Content */}
                <div className="scrollbar-none flex-1 space-y-3 overflow-y-auto p-6">
                    {appointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
                                <CalendarIcon className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/40">
                                Немає записів
                            </p>
                        </div>
                    ) : (
                        appointments
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((apt) => {
                                const info = getStaffInfo(apt.staffId);
                                return (
                                    <button
                                        key={apt.id}
                                        onClick={() => {
                                            onAppointmentClick(apt);
                                            onClose();
                                        }}
                                        className={clsx(
                                            'group relative w-full overflow-hidden rounded-[1.5rem] border-2 p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]',
                                            'bg-card shadow-sm hover:shadow-md',
                                            apt.type === 'important'
                                                ? 'border-amber-500/40'
                                                : apt.type === 'special'
                                                  ? 'border-destructive/40'
                                                  : 'border-primary/40',
                                        )}
                                    >
                                        <div
                                            className={clsx(
                                                'absolute inset-0 opacity-[0.08] transition-opacity group-hover:opacity-[0.12]',
                                                apt.type === 'important'
                                                    ? 'bg-amber-500'
                                                    : apt.type === 'special'
                                                      ? 'bg-destructive'
                                                      : 'bg-primary',
                                            )}
                                        />

                                        <div
                                            className={clsx(
                                                'absolute bottom-0 left-0 top-0 w-1.5',
                                                apt.type === 'important'
                                                    ? 'bg-amber-500'
                                                    : apt.type === 'special'
                                                      ? 'bg-destructive'
                                                      : 'bg-primary',
                                            )}
                                        />

                                        <div className="relative z-10">
                                            <div className="mb-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="rounded-lg border border-border/10 bg-background px-2 py-0.5 text-[10px] font-bold shadow-sm">
                                                        {apt.startTime} — {apt.endTime}
                                                    </span>
                                                    {apt.status === 'completed' && (
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                                                    {info.name}
                                                </span>
                                            </div>
                                            <div className="mb-1 font-heading text-lg font-bold tracking-tight transition-colors group-hover:text-primary">
                                                {apt.service}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                                                <div className="h-1 w-1 rounded-full bg-primary/40" />
                                                {apt.clientName}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-border/5 bg-muted/10 p-6">
                    <button
                        onClick={onClose}
                        className="w-full py-4 text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-primary"
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

    const filteredStaff = staff.filter((s) => selectedStaffIds.includes(s.id.toString()));

    const getAppointmentsForDay = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return appointments.filter((apt) => {
            if (apt.date !== dateStr) return false;
            const sid = apt.staffId?.toString() || 'unassigned';
            if (sid === 'unassigned') return true;
            return selectedStaffIds.includes(sid);
        });
    };

    const getAppointmentsByStaff = (dayAppointments: Appointment[]) => {
        const grouped: Record<string, Appointment[]> = {};
        dayAppointments.forEach((apt) => {
            const staffId = apt.staffId?.toString() || 'unassigned';
            if (!grouped[staffId]) grouped[staffId] = [];
            grouped[staffId].push(apt);
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

    const getStaffName = (staffId?: string) => {
        if (!staffId || staffId === 'unassigned') return 'Без майстра';
        return staff.find((s) => s.id.toString() === staffId.toString())?.name || 'Невідомий';
    };

    const weekDayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

    // Desktop
    const DesktopView = () => (
        <div className="scrollbar-thin h-full overflow-auto bg-background p-6">
            <div className="overflow-hidden rounded-[2rem] border border-border/10 bg-card shadow-2xl">
                {/* Header Row */}
                <div className="grid grid-cols-7 border-b border-border/10">
                    {weekDayNames.map((name) => (
                        <div
                            key={name}
                            className="border-r border-border/5 bg-muted/5 p-5 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground last:border-0"
                        >
                            {name}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                {weeks.map((week, weekIndex) => (
                    <div
                        key={weekIndex}
                        className="relative grid grid-cols-7 border-b border-border/10 last:border-0"
                    >
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
                                        'group/day relative min-h-[160px] cursor-pointer border-r border-border/10 p-4 transition-all last:border-0',
                                        !isCurrentMonth
                                            ? 'bg-muted/5 opacity-30 grayscale'
                                            : 'bg-background hover:bg-muted/5',
                                        isToday && 'bg-primary/5',
                                    )}
                                >
                                    {isToday && (
                                        <div className="absolute inset-x-4 top-0 z-10 h-1 rounded-b-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]" />
                                    )}

                                    <div
                                        className={clsx(
                                            'mb-3 font-heading text-lg font-bold transition-colors',
                                            isToday
                                                ? 'text-primary'
                                                : isCurrentMonth
                                                  ? 'text-foreground'
                                                  : 'text-muted-foreground group-hover/day:text-foreground',
                                        )}
                                    >
                                        {format(day, 'd')}
                                    </div>

                                    <div className="space-y-2">
                                        {staffWithAppointments.slice(0, 3).map((staffId) => {
                                            const count = appointmentsByStaff[staffId].length;
                                            return (
                                                <div
                                                    key={staffId}
                                                    className="flex items-center gap-2 truncate rounded-xl border border-border/10 bg-card p-2 text-[10px] font-bold text-muted-foreground transition-all group-hover/day:border-primary/20 group-hover/day:text-foreground"
                                                >
                                                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                                                    <span className="flex-1 truncate">
                                                        {getStaffName(staffId)}
                                                    </span>
                                                    <span className="text-[9px] opacity-40">
                                                        {count}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        {staffWithAppointments.length > 3 && (
                                            <div className="pt-1 text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30">
                                                +{staffWithAppointments.length - 3} ще
                                            </div>
                                        )}
                                        {dayAppointments.length === 0 && isCurrentMonth && (
                                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover/day:opacity-100">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                    <CalendarIcon className="h-4 w-4 text-primary" />
                                                </div>
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
    );

    // Mobile View
    const MobileView = () => (
        <div className="h-full space-y-4 overflow-y-auto bg-muted/20 p-4">
            {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="space-y-4">
                    {week.map((day) => {
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isToday = isSameDay(day, new Date());
                        const dayAppointments = getAppointmentsForDay(day);
                        const appointmentsByStaff = getAppointmentsByStaff(dayAppointments);
                        const staffWithAppointments = Object.keys(appointmentsByStaff);

                        if (!isCurrentMonth && dayAppointments.length === 0) return null;

                        return (
                            <div
                                key={day.toISOString()}
                                onClick={() => handleDayClick(day, dayAppointments)}
                                className={clsx(
                                    'cursor-pointer rounded-[2rem] border bg-card p-6 shadow-sm transition-all active:scale-[0.98]',
                                    isToday
                                        ? 'border-primary ring-1 ring-primary/20'
                                        : 'border-border/10',
                                    !isCurrentMonth && 'opacity-50 grayscale',
                                )}
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <div
                                        className={clsx(
                                            'font-heading text-xl font-bold tracking-tight',
                                            isToday ? 'text-primary' : 'text-foreground',
                                        )}
                                    >
                                        {format(day, 'd MMMM', { locale: uk })}
                                    </div>
                                    {isToday && (
                                        <span className="rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                                            Сьогодні
                                        </span>
                                    )}
                                </div>

                                {staffWithAppointments.length > 0 ? (
                                    <div className="grid gap-2">
                                        {staffWithAppointments.map((staffId) => {
                                            const count = appointmentsByStaff[staffId].length;
                                            return (
                                                <div
                                                    key={staffId}
                                                    className="flex items-center justify-between rounded-2xl border border-border/5 bg-muted/30 p-3"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-primary/40" />
                                                        <span className="text-xs font-bold tracking-tight">
                                                            {getStaffName(staffId)}
                                                        </span>
                                                    </div>
                                                    <span className="whitespace-nowrap rounded-lg border border-border/10 bg-background px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                                                        {count} записів
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">
                                        Немає записів
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );

    return (
        <>
            <div className="h-full lg:hidden">
                <MobileView />
            </div>
            <div className="hidden h-full lg:block">
                <DesktopView />
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
