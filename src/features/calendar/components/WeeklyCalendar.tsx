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
    const filteredStaff = staff.filter(s => selectedStaffIds.includes(s.id.toString()));

    const getAppointmentsForDayAndStaff = (date: Date, staffId: string) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return appointments.filter(
            apt => apt.date === dateStr && apt.staffId?.toString() === staffId.toString()
        );
    };

    const getAppointmentsForDay = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return appointments.filter(apt => {
            if (apt.date !== dateStr) return false;
            const sid = apt.staffId?.toString() || 'unassigned';
            if (sid === 'unassigned') return true; // Show unassigned too in weekly view
            return selectedStaffIds.includes(sid);
        });
    };

    const getStaffInfo = (staffId: string) => {
        if (staffId === 'unassigned') return { name: 'Без майстра', role: 'Черга' };
        const s = filteredStaff.find(s => s.id.toString() === staffId.toString());
        return s ? { name: s.name, role: getRoleLabel(s.role) } : { name: 'Невідомий', role: '' };
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
            case 'arrived':
                return <CheckCircle className="w-3 h-3 text-green-500" />;
            case 'cancelled':
                return <XCircle className="w-3 h-3 text-destructive" />;
            default:
                return <Clock className="w-3 h-3 text-muted-foreground/40" />;
        }
    };

    const getVariantClasses = (type: string) => {
        switch (type) {
            case 'important':
                return {
                    container: 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20',
                    indicator: 'bg-amber-500'
                };
            case 'special':
                return {
                    container: 'border-destructive/40 bg-destructive/10 hover:bg-destructive/20',
                    indicator: 'bg-destructive'
                };
            case 'standard':
            default:
                return {
                    container: 'border-primary/40 bg-primary/10 hover:bg-primary/20',
                    indicator: 'bg-primary'
                };
        }
    };

    // Mobile View
    const MobileView = () => (
        <div className="h-full overflow-y-auto p-4 space-y-6 bg-muted/20">
            {weekDays.map((day) => {
                const dayAppointments = getAppointmentsForDay(day);
                const isToday = isSameDay(day, new Date());
                const dateStr = format(day, 'yyyy-MM-dd');

                const appointmentsByStaff = dayAppointments.reduce((acc, apt) => {
                    const staffId = apt.staffId?.toString() || 'unassigned';
                    if (!acc[staffId]) acc[staffId] = [];
                    acc[staffId].push(apt);
                    return acc;
                }, {} as Record<string, Appointment[]>);

                return (
                    <div key={dateStr} className="space-y-3">
                        {/* Day Header */}
                        <div className="flex items-center gap-3">
                            <div className={clsx(
                                "w-12 h-12 rounded-2xl flex flex-col items-center justify-center border shadow-sm",
                                isToday ? "bg-primary border-primary text-white" : "bg-card border-border/50 text-foreground"
                            )}>
                                <span className="text-[10px] font-bold uppercase opacity-60 leading-none mb-1">
                                    {format(day, 'EEE', { locale: uk })}
                                </span>
                                <span className="text-lg font-bold leading-none">
                                    {format(day, 'd')}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold font-heading text-foreground">
                                    {format(day, 'MMMM', { locale: uk })}
                                </span>
                                {isToday && <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Сьогодні</span>}
                            </div>
                        </div>

                        {/* Appointments by staff group */}
                        <div className="ml-6 space-y-4 border-l-2 border-border/10 pl-6">
                            {Object.entries(appointmentsByStaff).map(([staffId, staffAppointments]) => {
                                const info = getStaffInfo(staffId);
                                return (
                                    <div key={staffId} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
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
                                                            'group text-left p-3 rounded-2xl border transition-all active:scale-[0.98] shadow-sm hover:shadow-md relative overflow-hidden',
                                                            styles.container
                                                        )}
                                                    >
                                                        {/* Vertical Indicator Block (Not rounded border but separate block) */}
                                                        <div className={clsx('absolute left-0 inset-y-0 w-1.5', styles.indicator)} />

                                                        <div className="relative z-10 pl-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-[10px] font-bold bg-background border border-border/10 px-1.5 py-0.5 rounded-md shadow-sm">
                                                                    {apt.startTime}
                                                                </span>
                                                                {getStatusIcon(apt.status)}
                                                            </div>
                                                            <div className="text-xs font-bold font-heading line-clamp-1 group-hover:text-primary transition-colors">
                                                                {apt.service}
                                                            </div>
                                                            <div className="text-[10px] font-bold text-muted-foreground mt-1 truncate">
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

                        {dayAppointments.length === 0 && (
                            <div className="ml-12 py-4 text-[11px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">
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
        <div className="h-full overflow-auto w-full bg-background scrollbar-thin">
            <div className="grid w-full min-w-[1200px]" style={{ gridTemplateColumns: `240px repeat(7, 1fr)` }}>
                {/* Headers */}
                <div className="sticky top-0 left-0 z-30 h-20 bg-background/95 backdrop-blur-md border-b border-r border-border/20 flex items-center px-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">Розклад</span>
                        <span className="text-sm font-bold font-heading">МАЙСТРИ</span>
                    </div>
                </div>
                {weekDays.map((day) => {
                    const isToday = isSameDay(day, new Date());
                    return (
                        <div
                            key={format(day, 'yyyy-MM-dd')}
                            className={clsx(
                                'sticky top-0 z-20 h-20 border-b border-r border-border/20 p-4 flex flex-col items-center justify-center transition-colors',
                                isToday ? 'bg-primary/[0.03] backdrop-blur-md' : 'bg-background/95 backdrop-blur-md'
                            )}
                        >
                            <div className={clsx(
                                "text-[10px] font-bold uppercase tracking-[0.2em] mb-1",
                                isToday ? "text-primary" : "text-muted-foreground"
                            )}>
                                {format(day, 'EEEE', { locale: uk })}
                            </div>
                            <div className={clsx(
                                'text-xl font-bold font-heading tracking-tighter',
                                isToday ? 'text-primary' : 'text-foreground'
                            )}>
                                {format(day, 'd MMMM', { locale: uk })}
                            </div>
                            {isToday && <div className="absolute bottom-0 left-4 right-4 h-1 bg-primary rounded-t-full" />}
                        </div>
                    );
                })}

                {/* Rows */}
                {/* Include unassigned if there are any appointments there */}
                {[{ id: 'unassigned', name: 'Без майстра', role: 'Черга' }, ...filteredStaff].map((staffMember) => (
                    <div key={staffMember.id.toString()} className="contents">
                        <div className={clsx(
                            "sticky left-0 z-10 border-b border-r border-border/20 p-6 flex flex-col justify-center min-h-[140px] group",
                            staffMember.id === 'unassigned' ? "bg-muted/10" : "bg-background/95 backdrop-blur-sm"
                        )}>
                            <div className={clsx(
                                "absolute left-0 inset-y-4 w-1 transition-colors rounded-r-full",
                                staffMember.id === 'unassigned' ? "bg-muted-foreground/30" : "bg-primary/20 group-hover:bg-primary"
                            )} />
                            <div className="font-bold text-sm tracking-tight font-heading group-hover:text-primary transition-colors truncate">
                                {staffMember.name}
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60 mt-1 truncate">
                                {staffMember.id === 'unassigned' ? 'Черга' : getRoleLabel(staffMember.role)}
                            </div>
                        </div>
                        {weekDays.map((day) => {
                            const dayAppointments = getAppointmentsForDayAndStaff(day, staffMember.id.toString());
                            const isToday = isSameDay(day, new Date());
                            const dateStr = format(day, 'yyyy-MM-dd');

                            if (dayAppointments.length === 0) {
                                return (
                                    <div key={dateStr} className={clsx(
                                        'border-b border-r border-border/10 p-2 min-h-[140px] transition-colors',
                                        isToday && 'bg-primary/[0.01]',
                                        staffMember.id === 'unassigned' && 'bg-muted/[0.03] diagonal-stripes'
                                    )} />
                                );
                            }

                            return (
                                <div
                                    key={dateStr}
                                    className={clsx(
                                        'border-b border-r border-border/10 p-3 min-h-[140px] transition-colors',
                                        isToday && 'bg-primary/[0.01]',
                                        staffMember.id === 'unassigned' && 'bg-muted/[0.03] diagonal-stripes'
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
                                                        'group w-full text-left p-3 rounded-2xl border transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md relative overflow-hidden',
                                                        styles.container
                                                    )}
                                                >
                                                    {/* Vertical Indicator Block (Separate from border) */}
                                                    <div className={clsx('absolute left-0 inset-y-0 w-1.5', styles.indicator)} />

                                                    <div className="relative z-10 pl-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[9px] font-bold bg-background border border-border/10 px-1.5 py-0.5 rounded-md shadow-sm">
                                                                {apt.startTime}
                                                            </span>
                                                            {getStatusIcon(apt.status)}
                                                        </div>
                                                        <div className="text-[11px] font-black font-heading leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                                                            {apt.service}
                                                        </div>
                                                        <div className="text-[9px] font-bold text-muted-foreground truncate italic opacity-80">
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
                ))}
            </div>
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
        </>
    );
}
