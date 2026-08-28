import { Notification } from '@/shared/components/ui/NotificationsDropdown';

export const mockNotifications: Notification[] = [
    {
        id: '1',
        title: 'Новий запис',
        message: 'Клієнт Марія Коваленко записалася на стрижку на 14:00',
        time: '5 хв тому',
        isRead: false,
        type: 'info',
        url: '/calendar',
    },
    {
        id: '2',
        title: 'Скасування запису',
        message: 'Запис на 15:00 було скасовано клієнтом',
        time: '1 год тому',
        isRead: false,
        type: 'warning',
        url: '/calendar',
    },
    {
        id: '3',
        title: 'Успішна оплата',
        message: 'Оплата за послугу "Фарбування волосся" успішно проведена',
        time: '2 год тому',
        isRead: true,
        type: 'success',
        url: '/finances',
    },
    {
        id: '4',
        title: 'Нагадування',
        message: 'Через 30 хвилин запис з клієнтом Іван Петренко',
        time: '3 год тому',
        isRead: true,
        type: 'info',
        url: '/calendar',
    },
];
