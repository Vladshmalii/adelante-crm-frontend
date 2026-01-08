'use client';

import { StaffMember, Appointment, TimeSlot } from '../../types';
import { TimeColumn } from './TimeColumn';
import { StaffColumn } from './StaffColumn';
import { getRoleLabel } from '@/features/staff/utils/roleTranslations';
import { useRef, useEffect } from 'react';
import { List } from 'lucide-react';
import clsx from 'clsx';

interface CalendarGridProps {
    staff: StaffMember[];
    appointments: Appointment[];
    onAppointmentClick: (appointment: Appointment) => void;
    onSlotClick: (staffId: string, time: string) => void;
    isAdmin: boolean;
}

const SLOT_HEIGHT = 80;
const START_HOUR = 8;
const END_HOUR = 21;
const WORK_END_HOUR = 19;

const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
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

    const sorted = [...appointments].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
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
                const h = Math.floor(minutes / 60).toString().padStart(2, '0');
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
        (a, b) => parseTime(a.startTime) - parseTime(b.startTime)
    );

    return withBreaks;
};

export function CalendarGrid({
    staff,
    appointments,
    onAppointmentClick,
    onSlotClick,
    isAdmin,
}: CalendarGridProps) {
    const timeSlots = generateTimeSlots();
    const containerRef = useRef<HTMLDivElement>(null);

    const initialScrollDone = useRef(false);
    useEffect(() => {
        if (containerRef.current && !initialScrollDone.current) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            const minutesFromStart = (currentHour - START_HOUR) * 60 + currentMinute;
            const scrollPosition = (minutesFromStart / 30) * SLOT_HEIGHT;
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

    const unassignedAppointments = appointments.filter(apt => !apt.staffId || apt.staffId.toString() === 'unassigned');

    const MobileView = () => {
        const allStaff = [unassignedStaff, ...staff];

        return (
            <div className="h-full overflow-y-auto p-4 space-y-4 bg-muted/20">
                {allStaff.map((staffMember) => {
                    const staffAppointments = staffMember.id === 'unassigned'
                        ? unassignedAppointments
                        : appointments.filter(apt => apt.staffId?.toString() === staffMember.id.toString());

                    const staffAppointmentsWithBreaks = addBreakAppointments(staffAppointments);

                    if (staffAppointmentsWithBreaks.length === 0) return null;

                    return (
                        <div key={staffMember.id} className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-border/50 bg-muted/30 flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-sm tracking-tight">{staffMember.name}</div>
                                    <div className="text-[10px] font-bold uppercase text-muted-foreground opacity-60 tracking-widest">{getRoleLabel(staffMember.role)}</div>
                                </div>
                                <div className="w-8 h-8 rounded-xl bg-background border border-border/50 flex items-center justify-center">
                                    <List className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                {staffAppointmentsWithBreaks.map((apt) => (
                                    <button
                                        key={apt.id}
                                        onClick={() => onAppointmentClick(apt)}
                                        className={clsx(
                                            'w-full text-left p-4 rounded-2xl transition-all active:scale-[0.98] border',
                                            apt.type === 'important' && 'bg-accent/5 border-accent/20',
                                            apt.type === 'special' && 'bg-destructive/5 border-destructive/20',
                                            apt.type === 'standard' && 'bg-primary/5 border-primary/20'
                                        )}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-bold bg-background/80 px-2 py-0.5 rounded-lg border border-border/10">
                                                {apt.startTime} — {apt.endTime}
                                            </span>
                                        </div>
                                        <div className="font-bold text-sm mb-1 leading-tight">{apt.service}</div>
                                        {apt.clientName && (
                                            <div className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
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
            className="flex overflow-x-auto overflow-y-auto h-full bg-background relative isolate scrollbar-thin scroll-smooth"
        >
            {/* Time Column - FIXED STICKY LEFT */}
            <div className="sticky left-0 z-40 bg-background shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                <TimeColumn timeSlots={timeSlots} slotHeight={SLOT_HEIGHT} />
            </div>

            {/* Scrolling Content - Unassigned + Staff */}
            <div className="flex flex-1">
                {/* Unassigned Staff - Regular flow */}
                <div className="min-w-[180px] sm:min-w-[220px] border-r border-border/10">
                    <StaffColumn
                        staff={unassignedStaff}
                        appointments={addBreakAppointments(unassignedAppointments)}
                        timeSlots={timeSlots}
                        slotHeight={SLOT_HEIGHT}
                        startHour={START_HOUR}
                        onAppointmentClick={onAppointmentClick}
                        onSlotClick={onSlotClick}
                        isAdmin={isAdmin}
                        className=""
                    />
                </div>

                {/* Regular Staff Columns */}
                {staff.map((staffMember) => {
                    const staffAppointments = appointments.filter(
                        (apt) => apt.staffId?.toString() === staffMember.id.toString()
                    );

                    const staffAppointmentsWithBreaks = addBreakAppointments(staffAppointments);

                    return (
                        <StaffColumn
                            key={staffMember.id}
                            staff={staffMember}
                            appointments={staffAppointmentsWithBreaks}
                            timeSlots={timeSlots}
                            slotHeight={SLOT_HEIGHT}
                            startHour={START_HOUR}
                            onAppointmentClick={onAppointmentClick}
                            onSlotClick={onSlotClick}
                            isAdmin={isAdmin}
                        />
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="h-full bg-background/50 border-t border-border/10">
            {/* Mobile View */}
            <div className="h-full lg:hidden">
                <MobileView />
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block h-full">
                <DesktopView />
            </div>
        </div>
    );
}
