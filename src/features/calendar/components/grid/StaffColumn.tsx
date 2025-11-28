'use client';

import { StaffMember, Appointment, TimeSlot } from '../../types';
import { AppointmentCard } from '../items/AppointmentCard';
import { useCurrentTime } from '@/shared/hooks/useCurrentTime';
import clsx from 'clsx';

interface StaffColumnProps {
    staff: StaffMember;
    appointments: Appointment[];
    timeSlots: TimeSlot[];
    slotHeight: number;
    startHour: number;
    onAppointmentClick: (appointment: Appointment) => void;
    onSlotClick: (staffId: string, time: string) => void;
}

export function StaffColumn({
    staff,
    appointments,
    timeSlots,
    slotHeight,
    startHour,
    onAppointmentClick,
    onSlotClick,
}: StaffColumnProps) {
    const currentTime = useCurrentTime();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    // Вычисляем позицию текущей линии времени
    const getCurrentTimePosition = () => {
        const totalMinutes = (currentHour - startHour) * 60 + currentMinute;
        return (totalMinutes / 30) * slotHeight;
    };

    // Вычисляем позицию и высоту карточки записи
    const getAppointmentStyle = (appointment: Appointment) => {
        const [startHour, startMinute] = appointment.startTime.split(':').map(Number);
        const [endHour, endMinute] = appointment.endTime.split(':').map(Number);

        const startMinutes = (startHour - 9) * 60 + startMinute;
        const endMinutes = (endHour - 9) * 60 + endMinute;
        const duration = endMinutes - startMinutes;

        const top = (startMinutes / 30) * slotHeight;
        const height = (duration / 30) * slotHeight;

        return {
            top: `${top}px`,
            height: `${height}px`,
        };
    };

    const handleSlotClick = (hour: number, minute: number) => {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        onSlotClick(staff.id, timeString);
    };

    const isCurrentTimeVisible = currentHour >= startHour && currentHour <= 18;
    const currentTimeTop = getCurrentTimePosition();

    return (
        <div className="flex-1 min-w-[150px] sm:min-w-[200px] border-r border-border bg-background relative">
            {/* Header */}
            <div className="h-16 px-2 sm:px-3 flex flex-col justify-center border-b border-border bg-muted/30">
                <div className="font-semibold text-foreground text-xs sm:text-sm truncate font-heading">
                    {staff.name}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {staff.role}
                </div>
            </div>

            {/* Grid */}
            <div className="relative">
                {/* Time slots background */}
                {timeSlots.map((slot) => (
                    <div
                        key={`${slot.hour}-${slot.minute}`}
                        className="border-b border-border/50 hover:bg-accent/50 cursor-pointer transition-colors"
                        style={{ height: `${slotHeight}px` }}
                        onClick={() => handleSlotClick(slot.hour, slot.minute)}
                    />
                ))}

                {/* Current time line */}
                {isCurrentTimeVisible && (
                    <div
                        className="absolute left-0 right-0 h-0.5 bg-accent z-20 pointer-events-none"
                        style={{ top: `${currentTimeTop}px` }}
                    >
                        <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-accent rounded-full shadow-sm" />
                    </div>
                )}

                {/* Appointments */}
                {appointments.map((appointment) => (
                    <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onClick={onAppointmentClick}
                        style={getAppointmentStyle(appointment)}
                    />
                ))}
            </div>
        </div>
    );
}