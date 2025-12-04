import { Notification } from '@/shared/components/ui/NotificationsDropdown';
import { UserProfile } from '@/features/profile/types';

export const mockNotifications: Notification[] = [
    {
        id: '1',
        title: 'Новий запис',
        message: 'Клієнт Марія Коваленко записалася на стрижку на 14:00',
        time: '5 хв тому',
        isRead: false,
        type: 'info',
    },
    {
        id: '2',
        title: 'Скасування запису',
        message: 'Запис на 15:00 було скасовано клієнтом',
        time: '1 год тому',
        isRead: false,
        type: 'warning',
    },
    {
        id: '3',
        title: 'Успішна оплата',
        message: 'Оплата за послугу "Фарбування волосся" успішно проведена',
        time: '2 год тому',
        isRead: true,
        type: 'success',
    },
    {
        id: '4',
        title: 'Нагадування',
        message: 'Через 30 хвилин запис з клієнтом Іван Петренко',
        time: '3 год тому',
        isRead: true,
        type: 'info',
    },
];

export const mockUserProfile: UserProfile = {
    id: '1',
    firstName: 'Марія',
    lastName: 'Іванова',
    email: 'maria.ivanova@example.com',
    phone: '+380 67 123 45 67',
    role: 'master',
    hireDate: '2022-03-15',
    salary: 25000,
    commission: 15,
    specialization: 'Майстер-перукар, колорист',
    workSchedule: 'Пн-Пт: 9:00-18:00',
    birthDate: '1995-06-20',
    address: 'м. Київ, вул. Хрещатик, 22',
    emergencyContact: 'Іван Іванов',
    emergencyPhone: '+380 67 987 65 43',
};
