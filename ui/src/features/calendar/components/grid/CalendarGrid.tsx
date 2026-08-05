'use client';

import { StaffMember, Appointment, TimeSlot } from '../../types';
import { TimeColumn } from './TimeColumn';
import { StaffColumn } from './StaffColumn';
import { getRoleLabel } from '@/features/staff/utils/roleTranslations';
import { useRef, useEffect, useMemo } from 'react';
import { List } from 'lucide-react';
import clsx from 'clsx';

interface CalendarGridProps {
    staff: StaffMember[];
    appointments: Appointment[];
    onAppointmentClick: (appointment: Appointment) => void;
    onSlotClick: (staffId: string, time: string) => void;
    isAdmin: boolean;
    slotDuration: number;
    isFitToScreen: boolean;
}

const SLOT_HEIGHT = 80;
const START_HOUR = 8;
const WORK_END_HOUR = 19;

const generateTimeSlots = (slotDuration: number, maxEndHour: number): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = START_HOUR; hour <= maxEndHour; hour++) {
        for (let minute = 0; minute < 60; minute += slotDuration) {
            const label = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            slots.push({
                hour,
                minute,
                label,
                isAfterWork: hour >= WORK_END_HOUR,
            });
        }
    }
    return slots;
};

const addBreakAppointments = (appointments: Appointment[]): Appointment[] => {
    if (appointments.length === 0) return [];

    const parseTime = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const sorted = [...appointments].sort(
        (a, b) => parseTime(a.startTime) - parseTime(b.startTime),
    );
    const breaks: Appointment[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        const currentEnd = parseTime(current.endTime);
        const nextStart = parseTime(next.startTime);
        const gap = nextStart - currentEnd;

        if (gap > 0 && gap <= 15) {
            const startMinutes = currentEnd;
            const endMinutes = nextStart;

            const toTimeString = (minutes: number) => {
                const h = Math.floor(minutes / 60)
                    .toString()
                    .padStart(2, '0');
                const m = (minutes % 60).toString().padStart(2, '0');
                return `${h}:${m}`;
            };

            breaks.push({
                id: `break-${current.staffId}-${startMinutes}-${endMinutes}`,
                staffId: current.staffId,
                clientName: 'Перерва',
                service: 'Перерва',
                startTime: toTimeString(startMinutes),
                endTime: toTimeString(endMinutes),
                date: current.date,
                status: 'scheduled',
                type: 'standard',
                notes: undefined,
                price: undefined,
            });
        }
    }

    const withBreaks = [...sorted, ...breaks].sort(
        (a, b) => parseTime(a.startTime) - parseTime(b.startTime),
    );

    return withBreaks;
};

export function CalendarGrid({
    staff,
    appointments,
    onAppointmentClick,
    onSlotClick,
    isAdmin,
    slotDuration,
    isFitToScreen,
}: CalendarGridProps) {
    const maxAppointmentEndHour = useMemo(() => {
        let maxEndHour = 19; // Default max is 19 (which visually ends the grid at 20:00)
        appointments.forEach((apt) => {
            if (apt.endTime) {
                const [endH, endM] = apt.endTime.split(':').map(Number);
                let requiredEndHour = endH;
                if (endM === 0) {
                    requiredEndHour = endH - 1;
                }
                if (requiredEndHour > maxEndHour) {
                    maxEndHour = requiredEndHour;
                }
            }
        });
        return maxEndHour;
    }, [appointments]);

    const timeSlots = generateTimeSlots(slotDuration, maxAppointmentEndHour);
    const containerRef = useRef<HTMLDivElement>(null);

    const initialScrollDone = useRef(false);
    useEffect(() => {
        if (containerRef.current && !initialScrollDone.current) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            const minutesFromStart = (currentHour - START_HOUR) * 60 + currentMinute;
            const scrollPosition = (minutesFromStart / slotDuration) * SLOT_HEIGHT;
            const offset = scrollPosition - 120;

            containerRef.current.scrollTop = Math.max(0, offset);
            initialScrollDone.current = true;
        }
    }, []);

    const unassignedStaff: StaffMember = {
        id: 'unassigned',
        name: 'Без майстра',
        role: 'Черга / План',
    };

    const unassignedAppointments = appointments.filter(
        (apt) => !apt.staffId || apt.staffId.toString() === 'unassigned',
    );

    const MobileView = () => {
        const allStaff = [unassignedStaff, ...staff];

        return (
            <div className="h-full space-y-4 overflow-y-auto bg-muted/20 p-4">
                {allStaff.map((staffMember) => {
                    const staffAppointments =
                        staffMember.id === 'unassigned'
                            ? unassignedAppointments
                            : appointments.filter(
                                  (apt) => apt.staffId?.toString() === staffMember.id.toString(),
                              );

                    const staffAppointmentsWithBreaks = addBreakAppointments(staffAppointments);

                    if (staffAppointmentsWithBreaks.length === 0) return null;

                    return (
                        <div
                            key={staffMember.id}
                            className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm"
                        >
                            <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 p-4">
                                <div>
                                    <div className="text-sm font-bold tracking-tight">
                                        {staffMember.name}
                                    </div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                                        {getRoleLabel(staffMember.role)}
                                    </div>
                                </div>
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/50 bg-background">
                                    <List className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="space-y-3 p-4">
                                {staffAppointmentsWithBreaks.map((apt) => (
                                    <button
                                        key={apt.id}
                                        onClick={() => onAppointmentClick(apt)}
                                        className={clsx(
                                            'w-full rounded-2xl border p-4 text-left transition-all active:scale-[0.98]',
                                            apt.type === 'important' &&
                                                'border-accent/20 bg-accent/5',
                                            apt.type === 'special' &&
                                                'border-destructive/20 bg-destructive/5',
                                            apt.type === 'standard' &&
                                                'border-primary/20 bg-primary/5',
                                        )}
                                    >
                                        <div className="mb-2 flex items-center gap-2">
                                            <span className="rounded-lg border border-border/10 bg-background/80 px-2 py-0.5 text-[10px] font-bold">
                                                {apt.startTime} — {apt.endTime}
                                            </span>
                                        </div>
                                        <div className="mb-1 text-sm font-bold leading-tight">
                                            {apt.service}
                                        </div>
                                        {apt.clientName && (
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary/20" />
                                                {apt.clientName}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const DesktopView = () => (
        <div
            ref={containerRef}
            className="scrollbar-thin relative isolate flex h-full overflow-x-auto overflow-y-auto scroll-smooth bg-background"
        >
            {/* Time Column - FIXED STICKY LEFT */}
            <div className="sticky left-0 z-40 bg-background shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                <TimeColumn timeSlots={timeSlots} slotHeight={SLOT_HEIGHT} />
            </div>

            {/* Scrolling Content - Unassigned + Staff */}
            <div className={clsx('flex flex-1', isFitToScreen ? 'w-full' : 'min-w-max')}>
                {/* Unassigned Staff - Regular flow */}
                <StaffColumn
                    staff={unassignedStaff}
                    appointments={addBreakAppointments(unassignedAppointments)}
                    timeSlots={timeSlots}
                    slotHeight={SLOT_HEIGHT}
                    slotDuration={slotDuration}
                    isFitToScreen={isFitToScreen}
                    startHour={START_HOUR}
                    onAppointmentClick={onAppointmentClick}
                    onSlotClick={onSlotClick}
                    isAdmin={isAdmin}
                    className="border-r border-border/10"
                />

                {/* Regular Staff Columns */}
                {staff.map((staffMember) => {
                    const staffAppointments = appointments.filter(
                        (apt) => apt.staffId?.toString() === staffMember.id.toString(),
                    );

                    const staffAppointmentsWithBreaks = addBreakAppointments(staffAppointments);

                    return (
                        <StaffColumn
                            key={staffMember.id}
                            staff={staffMember}
                            appointments={staffAppointmentsWithBreaks}
                            timeSlots={timeSlots}
                            slotHeight={SLOT_HEIGHT}
                            slotDuration={slotDuration}
                            isFitToScreen={isFitToScreen}
                            startHour={START_HOUR}
                            onAppointmentClick={onAppointmentClick}
                            onSlotClick={onSlotClick}
                            isAdmin={isAdmin}
                            className={
                                isFitToScreen ? 'border-r border-border/10 last:border-0' : ''
                            }
                        />
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="h-full border-t border-border/10 bg-background/50">
            {/* Mobile View */}
            <div className="h-full lg:hidden">
                <MobileView />
            </div>

            {/* Desktop View */}
            <div className="hidden h-full lg:block">
                <DesktopView />
            </div>
        </div>
    );
}
