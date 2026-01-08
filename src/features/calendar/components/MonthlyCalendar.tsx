'use client';

import { useState } from 'react';
import { StaffMember, Appointment } from '../types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';
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
        const s = staff.find(s => s.id.toString() === staffId.toString());
        return s ? { name: s.name, role: s.role } : { name: 'Невідомий', role: '' };
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className="relative bg-card border border-border/10 rounded-[2.5rem] shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden animate-scale-in flex flex-col">
                {/* Header */}
                <div className="p-8 border-b border-border/10 bg-muted/20 relative">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 w-10 h-10 rounded-full bg-background border border-border/10 flex items-center justify-center hover:scale-110 hover:bg-muted transition-all active:scale-95 shadow-lg"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <CalendarIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold font-heading tracking-tight">
                            {format(date, 'd MMMM yyyy', { locale: uk })}
                        </h3>
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                        {appointments.length} записів на цей день
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-3 scrollbar-none">
                    {appointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                                <CalendarIcon className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                            <p className="text-sm font-bold text-muted-foreground/40 uppercase tracking-widest">
                                Немає записів
                            </p>
                        </div>
                    ) : (
                        appointments.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((apt) => {
                            const info = getStaffInfo(apt.staffId);
                            return (
                                <button
                                    key={apt.id}
                                    onClick={() => {
                                        onAppointmentClick(apt);
                                        onClose();
                                    }}
                                    className={clsx(
                                        'group w-full text-left p-4 rounded-[1.5rem] border-2 transition-all hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden',
                                        'bg-card shadow-sm hover:shadow-md',
                                        apt.type === 'important' ? 'border-amber-500/40' : apt.type === 'special' ? 'border-destructive/40' : 'border-primary/40'
                                    )}
                                >
                                    <div className={clsx(
                                        'absolute inset-0 opacity-[0.08] transition-opacity group-hover:opacity-[0.12]',
                                        apt.type === 'important' ? 'bg-amber-500' : apt.type === 'special' ? 'bg-destructive' : 'bg-primary'
                                    )} />

                                    <div className={clsx(
                                        'absolute left-0 top-0 bottom-0 w-1.5',
                                        apt.type === 'important' ? 'bg-amber-500' : apt.type === 'special' ? 'bg-destructive' : 'bg-primary'
                                    )} />

                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold bg-background border border-border/10 px-2 py-0.5 rounded-lg shadow-sm">
                                                    {apt.startTime} — {apt.endTime}
                                                </span>
                                                {apt.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                                                {info.name}
                                            </span>
                                        </div>
                                        <div className="text-lg font-bold font-heading tracking-tight mb-1 group-hover:text-primary transition-colors">
                                            {apt.service}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                                            <div className="w-1 h-1 rounded-full bg-primary/40" />
                                            {apt.clientName}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-muted/10 border-t border-border/5">
                    <button
                        onClick={onClose}
                        className="w-full py-4 text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground hover:text-primary transition-colors"
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

    const filteredStaff = staff.filter(s => selectedStaffIds.includes(s.id.toString()));

    const getAppointmentsForDay = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return appointments.filter(apt => {
            if (apt.date !== dateStr) return false;
            const sid = apt.staffId?.toString() || 'unassigned';
            if (sid === 'unassigned') return true;
            return selectedStaffIds.includes(sid);
        });
    };

    const getAppointmentsByStaff = (dayAppointments: Appointment[]) => {
        const grouped: Record<string, Appointment[]> = {};
        dayAppointments.forEach(apt => {
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
        return staff.find(s => s.id.toString() === staffId.toString())?.name || 'Невідомий';
    };

    const weekDayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

    // Desktop
    const DesktopView = () => (
        <div className="h-full overflow-auto p-6 bg-background scrollbar-thin">
            <div className="bg-card border border-border/10 rounded-[2rem] overflow-hidden shadow-2xl">
                {/* Header Row */}
                <div className="grid grid-cols-7 border-b border-border/10">
                    {weekDayNames.map((name) => (
                        <div
                            key={name}
                            className="p-5 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground bg-muted/5 border-r border-border/5 last:border-0"
                        >
                            {name}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 border-b border-border/10 last:border-0 relative">
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
                                        'min-h-[160px] p-4 border-r border-border/10 last:border-0 relative transition-all group/day cursor-pointer',
                                        !isCurrentMonth ? 'bg-muted/5 opacity-30 grayscale' : 'bg-background hover:bg-muted/5',
                                        isToday && 'bg-primary/5'
                                    )}
                                >
                                    {isToday && <div className="absolute inset-x-4 top-0 h-1 bg-primary rounded-b-full shadow-[0_0_10px_rgba(var(--primary),0.3)] z-10" />}

                                    <div className={clsx(
                                        'text-lg font-bold font-heading mb-3 transition-colors',
                                        isToday ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground group-hover/day:text-foreground'
                                    )}>
                                        {format(day, 'd')}
                                    </div>

                                    <div className="space-y-2">
                                        {staffWithAppointments.slice(0, 3).map((staffId) => {
                                            const count = appointmentsByStaff[staffId].length;
                                            return (
                                                <div
                                                    key={staffId}
                                                    className="text-[10px] font-bold p-2 rounded-xl bg-card border border-border/10 text-muted-foreground truncate flex items-center gap-2 group-hover/day:border-primary/20 group-hover/day:text-foreground transition-all"
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                                    <span className="truncate flex-1">{getStaffName(staffId)}</span>
                                                    <span className="text-[9px] opacity-40">{count}</span>
                                                </div>
                                            );
                                        })}
                                        {staffWithAppointments.length > 3 && (
                                            <div className="text-[9px] font-bold text-muted-foreground/30 text-center uppercase tracking-widest pt-1">
                                                +{staffWithAppointments.length - 3} ще
                                            </div>
                                        )}
                                        {dayAppointments.length === 0 && isCurrentMonth && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/day:opacity-100 transition-opacity pointer-events-none">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <CalendarIcon className="w-4 h-4 text-primary" />
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
        <div className="h-full overflow-y-auto p-4 space-y-4 bg-muted/20">
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
                                    'bg-card border rounded-[2rem] p-6 cursor-pointer transition-all active:scale-[0.98] shadow-sm',
                                    isToday ? 'border-primary ring-1 ring-primary/20' : 'border-border/10',
                                    !isCurrentMonth && 'opacity-50 grayscale'
                                )}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={clsx(
                                        'text-xl font-bold font-heading tracking-tight',
                                        isToday ? 'text-primary' : 'text-foreground'
                                    )}>
                                        {format(day, 'd MMMM', { locale: uk })}
                                    </div>
                                    {isToday && (
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-lg">Сьогодні</span>
                                    )}
                                </div>

                                {staffWithAppointments.length > 0 ? (
                                    <div className="grid gap-2">
                                        {staffWithAppointments.map((staffId) => {
                                            const count = appointmentsByStaff[staffId].length;
                                            return (
                                                <div
                                                    key={staffId}
                                                    className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/5"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-primary/40" />
                                                        <span className="text-xs font-bold tracking-tight">{getStaffName(staffId)}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold bg-background border border-border/10 px-2 py-0.5 rounded-lg text-muted-foreground whitespace-nowrap">
                                                        {count} записів
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] py-2 text-center">
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
            <div className="hidden lg:block h-full">
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
