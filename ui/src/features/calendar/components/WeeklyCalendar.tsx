'use client';

import { StaffMember, Appointment } from '../types';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { uk } from 'date-fns/locale';
import { getRoleLabel } from '@/features/staff/utils/roleTranslations';
import { User, Calendar as CalendarIcon, Clock, CheckCircle, XCircle } from 'lucide-react';
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

    // Normalize IDs for comparison
    const filteredStaff = staff.filter((s) => selectedStaffIds.includes(s.id.toString()));

    const getAppointmentsForDayAndStaff = (date: Date, staffId: string) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return appointments.filter(
            (apt) => apt.date === dateStr && apt.staffId?.toString() === staffId.toString(),
        );
    };

    const getAppointmentsForDay = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return appointments.filter((apt) => {
            if (apt.date !== dateStr) return false;
            const sid = apt.staffId?.toString() || 'unassigned';
            if (sid === 'unassigned') return true; // Show unassigned too in weekly view
            return selectedStaffIds.includes(sid);
        });
    };

    const getStaffInfo = (staffId: string) => {
        if (staffId === 'unassigned') return { name: 'Без майстра', role: 'Черга' };
        const s = filteredStaff.find((s) => s.id.toString() === staffId.toString());
        return s ? { name: s.name, role: getRoleLabel(s.role) } : { name: 'Невідомий', role: '' };
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
            case 'arrived':
                return <CheckCircle className="h-3 w-3 text-green-500" />;
            case 'cancelled':
                return <XCircle className="h-3 w-3 text-destructive" />;
            default:
                return <Clock className="h-3 w-3 text-muted-foreground/40" />;
        }
    };

    const getVariantClasses = (type: string) => {
        switch (type) {
            case 'important':
                return {
                    container: 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20',
                    indicator: 'bg-amber-500',
                };
            case 'special':
                return {
                    container: 'border-destructive/40 bg-destructive/10 hover:bg-destructive/20',
                    indicator: 'bg-destructive',
                };
            case 'standard':
            default:
                return {
                    container: 'border-primary/40 bg-primary/10 hover:bg-primary/20',
                    indicator: 'bg-primary',
                };
        }
    };

    // Mobile View
    const MobileView = () => (
        <div className="h-full space-y-6 overflow-y-auto bg-muted/20 p-4">
            {weekDays.map((day) => {
                const dayAppointments = getAppointmentsForDay(day);
                const isToday = isSameDay(day, new Date());
                const dateStr = format(day, 'yyyy-MM-dd');

                const appointmentsByStaff = dayAppointments.reduce(
                    (acc, apt) => {
                        const staffId = apt.staffId?.toString() || 'unassigned';
                        if (!acc[staffId]) acc[staffId] = [];
                        acc[staffId].push(apt);
                        return acc;
                    },
                    {} as Record<string, Appointment[]>,
                );

                return (
                    <div key={dateStr} className="space-y-3">
                        {/* Day Header */}
                        <div className="flex items-center gap-3">
                            <div
                                className={clsx(
                                    'flex h-12 w-12 flex-col items-center justify-center rounded-2xl border shadow-sm',
                                    isToday
                                        ? 'border-primary bg-primary text-white'
                                        : 'border-border/50 bg-card text-foreground',
                                )}
                            >
                                <span className="mb-1 text-[10px] font-bold uppercase leading-none opacity-60">
                                    {format(day, 'EEE', { locale: uk })}
                                </span>
                                <span className="text-lg font-bold leading-none">
                                    {format(day, 'd')}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-heading text-sm font-bold text-foreground">
                                    {format(day, 'MMMM', { locale: uk })}
                                </span>
                                {isToday && (
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                                        Сьогодні
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Appointments by staff group */}
                        <div className="ml-6 space-y-4 border-l-2 border-border/10 pl-6">
                            {Object.entries(appointmentsByStaff).map(
                                ([staffId, staffAppointments]) => {
                                    const info = getStaffInfo(staffId);
                                    return (
                                        <div key={staffId} className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                    {info.name}
                                                </span>
                                            </div>
                                            <div className="grid gap-2">
                                                {staffAppointments.map((apt) => {
                                                    const styles = getVariantClasses(apt.type);
                                                    return (
                                                        <button
                                                            key={apt.id}
                                                            onClick={() => onAppointmentClick(apt)}
                                                            className={clsx(
                                                                'group relative overflow-hidden rounded-2xl border p-3 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98]',
                                                                styles.container,
                                                            )}
                                                        >
                                                            {/* Vertical Indicator Block (Not rounded border but separate block) */}
                                                            <div
                                                                className={clsx(
                                                                    'absolute inset-y-0 left-0 w-1.5',
                                                                    styles.indicator,
                                                                )}
                                                            />

                                                            <div className="relative z-10 pl-1">
                                                                <div className="mb-1 flex items-center justify-between">
                                                                    <span className="rounded-md border border-border/10 bg-background px-1.5 py-0.5 text-[10px] font-bold shadow-sm">
                                                                        {apt.startTime}
                                                                    </span>
                                                                    {getStatusIcon(apt.status)}
                                                                </div>
                                                                <div className="line-clamp-1 font-heading text-xs font-bold transition-colors group-hover:text-primary">
                                                                    {apt.service}
                                                                </div>
                                                                <div className="mt-1 truncate text-[10px] font-bold text-muted-foreground">
                                                                    {apt.clientName}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                },
                            )}
                        </div>

                        {dayAppointments.length === 0 && (
                            <div className="ml-12 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">
                                Немає записів
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    // Desktop View
    const DesktopView = () => (
        <div className="scrollbar-thin h-full w-full overflow-auto bg-background">
            <div
                className="grid w-full min-w-[1200px]"
                style={{ gridTemplateColumns: `240px repeat(7, 1fr)` }}
            >
                {/* Headers */}
                <div className="sticky left-0 top-0 z-30 flex h-20 items-center border-b border-r border-border/20 bg-background/95 px-6 backdrop-blur-md">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                            Розклад
                        </span>
                        <span className="font-heading text-sm font-bold">МАЙСТРИ</span>
                    </div>
                </div>
                {weekDays.map((day) => {
                    const isToday = isSameDay(day, new Date());
                    return (
                        <div
                            key={format(day, 'yyyy-MM-dd')}
                            className={clsx(
                                'sticky top-0 z-20 flex h-20 flex-col items-center justify-center border-b border-r border-border/20 p-4 transition-colors',
                                isToday
                                    ? 'bg-primary/[0.03] backdrop-blur-md'
                                    : 'bg-background/95 backdrop-blur-md',
                            )}
                        >
                            <div
                                className={clsx(
                                    'mb-1 text-[10px] font-bold uppercase tracking-[0.2em]',
                                    isToday ? 'text-primary' : 'text-muted-foreground',
                                )}
                            >
                                {format(day, 'EEEE', { locale: uk })}
                            </div>
                            <div
                                className={clsx(
                                    'font-heading text-xl font-bold tracking-tighter',
                                    isToday ? 'text-primary' : 'text-foreground',
                                )}
                            >
                                {format(day, 'd MMMM', { locale: uk })}
                            </div>
                            {isToday && (
                                <div className="absolute bottom-0 left-4 right-4 h-1 rounded-t-full bg-primary" />
                            )}
                        </div>
                    );
                })}

                {/* Rows */}
                {/* Include unassigned if there are any appointments there */}
                {[{ id: 'unassigned', name: 'Без майстра', role: 'Черга' }, ...filteredStaff].map(
                    (staffMember) => (
                        <div key={staffMember.id.toString()} className="contents">
                            <div
                                className={clsx(
                                    'group sticky left-0 z-10 flex min-h-[140px] flex-col justify-center border-b border-r border-border/20 p-6',
                                    staffMember.id === 'unassigned'
                                        ? 'bg-muted/10'
                                        : 'bg-background/95 backdrop-blur-sm',
                                )}
                            >
                                <div
                                    className={clsx(
                                        'absolute inset-y-4 left-0 w-1 rounded-r-full transition-colors',
                                        staffMember.id === 'unassigned'
                                            ? 'bg-muted-foreground/30'
                                            : 'bg-primary/20 group-hover:bg-primary',
                                    )}
                                />
                                <div className="truncate font-heading text-sm font-bold tracking-tight transition-colors group-hover:text-primary">
                                    {staffMember.name}
                                </div>
                                <div className="mt-1 truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                                    {staffMember.id === 'unassigned'
                                        ? 'Черга'
                                        : getRoleLabel(staffMember.role)}
                                </div>
                            </div>
                            {weekDays.map((day) => {
                                const dayAppointments = getAppointmentsForDayAndStaff(
                                    day,
                                    staffMember.id.toString(),
                                );
                                const isToday = isSameDay(day, new Date());
                                const dateStr = format(day, 'yyyy-MM-dd');

                                if (dayAppointments.length === 0) {
                                    return (
                                        <div
                                            key={dateStr}
                                            className={clsx(
                                                'min-h-[140px] border-b border-r border-border/10 p-2 transition-colors',
                                                isToday && 'bg-primary/[0.01]',
                                                staffMember.id === 'unassigned' &&
                                                    'diagonal-stripes bg-muted/[0.03]',
                                            )}
                                        />
                                    );
                                }

                                return (
                                    <div
                                        key={dateStr}
                                        className={clsx(
                                            'min-h-[140px] border-b border-r border-border/10 p-3 transition-colors',
                                            isToday && 'bg-primary/[0.01]',
                                            staffMember.id === 'unassigned' &&
                                                'diagonal-stripes bg-muted/[0.03]',
                                        )}
                                    >
                                        <div className="space-y-2">
                                            {dayAppointments.map((apt) => {
                                                const styles = getVariantClasses(apt.type);
                                                return (
                                                    <button
                                                        key={apt.id}
                                                        onClick={() => onAppointmentClick(apt)}
                                                        className={clsx(
                                                            'group relative w-full overflow-hidden rounded-2xl border p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                                                            styles.container,
                                                        )}
                                                    >
                                                        {/* Vertical Indicator Block (Separate from border) */}
                                                        <div
                                                            className={clsx(
                                                                'absolute inset-y-0 left-0 w-1.5',
                                                                styles.indicator,
                                                            )}
                                                        />

                                                        <div className="relative z-10 pl-1">
                                                            <div className="mb-2 flex items-center justify-between">
                                                                <span className="rounded-md border border-border/10 bg-background px-1.5 py-0.5 text-[9px] font-bold shadow-sm">
                                                                    {apt.startTime}
                                                                </span>
                                                                {getStatusIcon(apt.status)}
                                                            </div>
                                                            <div className="mb-1 line-clamp-2 font-heading text-[11px] font-black leading-tight transition-colors group-hover:text-primary">
                                                                {apt.service}
                                                            </div>
                                                            <div className="truncate text-[9px] font-bold italic text-muted-foreground opacity-80">
                                                                {apt.clientName}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ),
                )}
            </div>
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
        </>
    );
}
