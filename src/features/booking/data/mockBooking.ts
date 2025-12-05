import type { BookingService, BookingStaff } from '../types';

export const mockBookingServices: BookingService[] = [
    { id: '1', name: 'Стрижка жіноча', duration: 60, price: 500, category: 'Перукарські послуги' },
    { id: '2', name: 'Стрижка чоловіча', duration: 30, price: 300, category: 'Перукарські послуги' },
    { id: '3', name: 'Фарбування волосся', duration: 120, price: 1500, category: 'Перукарські послуги' },
    { id: '4', name: 'Манікюр класичний', duration: 60, price: 400, category: 'Нігтьовий сервіс' },
    { id: '5', name: 'Педикюр', duration: 90, price: 600, category: 'Нігтьовий сервіс' },
    { id: '6', name: 'Масаж спини', duration: 45, price: 700, category: 'Масаж' },
    { id: '7', name: 'Масаж загальний', duration: 90, price: 1200, category: 'Масаж' },
];

export const mockBookingStaff: BookingStaff[] = [
    {
        id: '1',
        name: 'Олена Шевченко',
        specializations: ['Перукарські послуги'],
        availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    },
    {
        id: '2',
        name: 'Марія Коваленко',
        specializations: ['Нігтьовий сервіс'],
        availableSlots: ['10:00', '11:30', '13:00', '14:30', '16:00'],
    },
    {
        id: '3',
        name: 'Анна Левченко',
        specializations: ['Масаж'],
        availableSlots: ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'],
    },
];

export const SERVICE_CATEGORIES = [
    'Перукарські послуги',
    'Нігтьовий сервіс',
    'Масаж',
];
