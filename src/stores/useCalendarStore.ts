import { create } from 'zustand';

interface Appointment {
    id: string;
    clientId: string;
    staffId: string;
    serviceId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    notes?: string;
}

type CalendarView = 'day' | 'week' | 'month';

interface AppointmentFilters {
    staffId?: string;
    serviceId?: string;
    status?: string;
}

interface CalendarState {
    appointments: Appointment[];
    selectedDate: string;
    view: CalendarView;
    isLoading: boolean;
    filters: AppointmentFilters;
    selectedAppointment: Appointment | null;

    setAppointments: (appointments: Appointment[]) => void;
    addAppointment: (appointment: Appointment) => void;
    updateAppointment: (id: string, data: Partial<Appointment>) => void;
    deleteAppointment: (id: string) => void;
    setSelectedDate: (date: string) => void;
    setView: (view: CalendarView) => void;
    setFilters: (filters: AppointmentFilters) => void;
    setLoading: (isLoading: boolean) => void;
    selectAppointment: (appointment: Appointment | null) => void;
    updateStatus: (id: string, status: Appointment['status']) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
    appointments: [],
    selectedDate: new Date().toISOString().split('T')[0],
    view: 'day',
    isLoading: false,
    filters: {},
    selectedAppointment: null,

    setAppointments: (appointments) => set({ appointments }),

    addAppointment: (appointment) =>
        set((state) => ({
            appointments: [...state.appointments, appointment],
        })),

    updateAppointment: (id, data) =>
        set((state) => ({
            appointments: state.appointments.map((a) =>
                a.id === id ? { ...a, ...data } : a
            ),
        })),

    deleteAppointment: (id) =>
        set((state) => ({
            appointments: state.appointments.filter((a) => a.id !== id),
        })),

    setSelectedDate: (date) => set({ selectedDate: date }),

    setView: (view) => set({ view }),

    setFilters: (filters) => set({ filters }),

    setLoading: (isLoading) => set({ isLoading }),

    selectAppointment: (appointment) => set({ selectedAppointment: appointment }),

    updateStatus: (id, status) =>
        set((state) => ({
            appointments: state.appointments.map((a) =>
                a.id === id ? { ...a, status } : a
            ),
        })),
}));
