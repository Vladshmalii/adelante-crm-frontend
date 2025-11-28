'use client';

import { StaffMember, Appointment, TimeSlot } from '../../types';
import { TimeColumn } from './TimeColumn';
import { StaffColumn } from './StaffColumn';

interface CalendarGridProps {
    staff: StaffMember[];
    appointments: Appointment[];
    onAppointmentClick: (appointment: Appointment) => void;
    onSlotClick: (staffId: string, time: string) => void;
}

const SLOT_HEIGHT = 60; // Высота одного 30-минутного слота в пикселях
const START_HOUR = 9;
const END_HOUR = 18;

// Генерируем слоты времени
const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            slots.push({
                hour,
                minute,
                label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
            });
        }
    }
    return slots;
};

export function CalendarGrid({
                                 staff,
                                 appointments,
                                 onAppointmentClick,
                                 onSlotClick,
                             }: CalendarGridProps) {
    const timeSlots = generateTimeSlots();

    return (
        <div className="flex overflow-x-auto scrollbar-thin">
            {/* Time Column */}
            <TimeColumn timeSlots={timeSlots} slotHeight={SLOT_HEIGHT} />

            {/* Staff Columns */}
            {staff.map((staffMember) => {
                const staffAppointments = appointments.filter(
                    (apt) => apt.staffId === staffMember.id
                );

                return (
                    <StaffColumn
                        key={staffMember.id}
                        staff={staffMember}
                        appointments={staffAppointments}
                        timeSlots={timeSlots}
                        slotHeight={SLOT_HEIGHT}
                        startHour={START_HOUR}
                        onAppointmentClick={onAppointmentClick}
                        onSlotClick={onSlotClick}
                    />
                );
            })}
        </div>
    );
}