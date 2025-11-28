export interface StaffMember {
    id: string;
    name: string;
    role: string;
    color?: string;
}

export type AppointmentStatus =
    | 'scheduled'    // Записано
    | 'confirmed'    // Підтверджено
    | 'arrived'      // Прийшов
    | 'no-show'      // Не прийшов
    | 'cancelled'    // Відміна
    | 'completed'    // Завершено
    | 'paid';        // Оплачено

export type AppointmentType = 'standard' | 'important' | 'special';

export interface Appointment {
    id: string;
    staffId: string;
    clientName: string;
    clientPhone?: string;
    service: string;
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
    date: string;      // YYYY-MM-DD format
    status: AppointmentStatus;
    type: AppointmentType;
    notes?: string;
    price?: number;
}

export interface TimeSlot {
    hour: number;
    minute: number;
    label: string;
}

export type CalendarView = 'day' | 'week' | 'month';