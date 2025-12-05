'use client';

import { StaffMember, Appointment, TimeSlot } from '../../types';
import { TimeColumn } from './TimeColumn';
import { StaffColumn } from './StaffColumn';
import { useRef, useEffect } from 'react';

interface CalendarGridProps {
    staff: StaffMember[];
    appointments: Appointment[];
    onAppointmentClick: (appointment: Appointment) => void;
    onSlotClick: (staffId: string, time: string) => void;
    isAdmin: boolean;
}

const SLOT_HEIGHT = 60;
const START_HOUR = 8;
const END_HOUR = 20;
const WORK_END_HOUR = 18;

const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            slots.push({
                hour,
                minute,
                label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
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

    useEffect(() => {
        if (containerRef.current) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            // Calculate position in pixels
            // (Hour - Start) * (Slots per hour * Slot Height) + (Minutes / 30 * Slot Height)
            const minutesFromStart = (currentHour - START_HOUR) * 60 + currentMinute;
            const scrollPosition = (minutesFromStart / 30) * SLOT_HEIGHT;

            // Scroll to center the current time. 
            // Subtract half of container height (approx 300px) or just scroll to 1 hour before
            const offset = scrollPosition - 100; // Show a bit of context before

            containerRef.current.scrollTop = Math.max(0, offset);
        }
    }, []);

    const unassignedStaff: StaffMember = {
        id: 'unassigned',
        name: 'Без майстра',
        role: 'Черга / Записи',
    };

    const unassignedAppointments = appointments.filter(apt => apt.staffId === 'unassigned');

    return (
        <div
            ref={containerRef}
            className="flex overflow-x-auto overflow-y-auto scrollbar-thin h-full bg-background relative isolate"
        >
            <div className="sticky left-0 z-30 bg-background border-r border-border">
                <TimeColumn timeSlots={timeSlots} slotHeight={SLOT_HEIGHT} />
            </div>

            <div className="sticky left-12 sm:left-16 z-20 min-w-[200px]">
                <StaffColumn
                    staff={unassignedStaff}
                    appointments={addBreakAppointments(unassignedAppointments)}
                    timeSlots={timeSlots}
                    slotHeight={SLOT_HEIGHT}
                    startHour={START_HOUR}
                    onAppointmentClick={onAppointmentClick}
                    onSlotClick={onSlotClick}
                    isAdmin={isAdmin}
                    className="bg-accent/10"
                />
            </div>

            {staff.map((staffMember) => {
                const staffAppointments = appointments.filter(
                    (apt) => apt.staffId === staffMember.id
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
    );
}