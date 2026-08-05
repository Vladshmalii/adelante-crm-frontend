export interface BookingService {
    id: string;
    name: string;
    duration: number;
    price: number;
    category: string;
}

export interface BookingStaff {
    id: string;
    name: string;
    avatar?: string;
    specializations: string[];
    availableSlots: string[];
}

export interface BookingSlot {
    time: string;
    available: boolean;
}

export interface BookingFormData {
    serviceId: string;
    staffId: string;
    date: string;
    time: string;
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    comment?: string;
}

export type BookingStep = 'service' | 'staff' | 'datetime' | 'details' | 'confirm';
