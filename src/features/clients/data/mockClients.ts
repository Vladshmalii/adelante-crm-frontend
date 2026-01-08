import type { Client } from '../types';

export const CLIENTS_MOCK: Client[] = [
    {
        id: '1',
        firstName: 'Анна',
        lastName: 'Петрова',

        phone: '+380 67 123 45 67',
        email: 'anna.petrova@gmail.com',
        totalSpent: 15420,
        totalVisits: 12,
        discount: 10,
        lastVisit: '2026-01-01T14:30:00',
        segment: 'repeat',
        visits: [
            {
                id: 'v1',
                clientId: '1',
                date: '2026-01-01T14:30:00',
                serviceName: 'Манікюр з покриттям',
                staffId: '1',
                staffName: 'Олена Косенко',
                notes: 'Любить коротко, п\'є зелений чай. Чутлива шкіра навколо нігтів.',
                photos: [
                    'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800&auto=format&fit=crop&q=60',
                    'https://images.unsplash.com/photo-1604654894610-df490982570d?w=800&auto=format&fit=crop&q=60'
                ],
                status: 'completed'
            },
            {
                id: 'v2',
                clientId: '1',
                date: '2025-12-15T11:00:00',
                serviceName: 'Манікюр без покриття',
                staffId: '2',
                staffName: 'Марія Іванова',
                notes: 'Приходила з дитиною. Дитина спокійна.',
                photos: [
                    'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800&auto=format&fit=crop&q=60'
                ],
                status: 'completed'
            }
        ]
    },
    {
        id: '2',
        firstName: 'Ольга',
        lastName: 'Іваненко',

        phone: '+380 50 987 65 43',
        email: 'olga.ivanenko@ukr.net',
        totalSpent: 8900,
        totalVisits: 7,
        discount: 5,
        lastVisit: '2025-12-27T16:15:00',
        segment: 'repeat',
    },
    {
        id: '3',
        firstName: 'Марія',
        lastName: 'Коваленко',

        phone: '+380 93 456 78 90',
        totalSpent: 2300,
        totalVisits: 1,
        discount: 0,
        lastVisit: '2026-01-02T13:00:00',
        segment: 'new',
    },
    {
        id: '4',
        firstName: 'Наталія',
        lastName: 'Бондаренко',

        phone: '+380 66 234 56 78',
        email: 'natalia.bond@gmail.com',
        totalSpent: 23500,
        totalVisits: 18,
        discount: 15,
        lastVisit: '2024-09-15T10:30:00',
        segment: 'lost',
    },
    {
        id: '5',
        firstName: 'Катерина',
        lastName: 'Мельник',

        phone: '+380 99 876 54 32',
        email: 'kateryna.melnyk@ukr.net',
        totalSpent: 19800,
        totalVisits: 15,
        discount: 12,
        lastVisit: '2025-12-31T15:45:00',
        segment: 'subscription-ending',
    },
    {
        id: '6',
        firstName: 'Тетяна',
        lastName: 'Шевченко',

        phone: '+380 68 345 67 89',
        totalSpent: 5600,
        totalVisits: 4,
        discount: 0,
        lastVisit: '2025-12-29T11:20:00',
        segment: 'repeat',
    },
    {
        id: '7',
        firstName: 'Юлія',
        lastName: 'Ткаченко',

        phone: '+380 95 123 45 67',
        email: 'yulia.tkachenko@gmail.com',
        totalSpent: 12400,
        totalVisits: 9,
        discount: 8,
        lastVisit: '2025-12-30T17:30:00',
        segment: 'repeat',
    },
    {
        id: '8',
        firstName: 'Ірина',
        lastName: 'Литвиненко',

        phone: '+380 97 765 43 21',
        totalSpent: 3200,
        totalVisits: 2,
        discount: 0,
        lastVisit: '2024-11-18T14:00:00',
        segment: 'new',
    },
    {
        id: '9',
        firstName: 'Віра',
        lastName: 'Сидоренко',

        phone: '+380 63 456 78 90',
        email: 'vira.sydorenko@ukr.net',
        totalSpent: 28700,
        totalVisits: 22,
        discount: 20,
        lastVisit: '2024-08-20T09:15:00',
        segment: 'lost',
    },
    {
        id: '10',
        firstName: 'Світлана',
        lastName: 'Гончарова',

        phone: '+380 91 234 56 78',
        totalSpent: 7800,
        totalVisits: 6,
        discount: 5,
        lastVisit: '2025-12-28T16:00:00',
        segment: 'repeat',
    },
    {
        id: '11',
        firstName: 'Оксана',
        lastName: 'Козлова',

        phone: '+380 67 890 12 34',
        email: 'oksana.kozlova@gmail.com',
        totalSpent: 16200,
        totalVisits: 13,
        discount: 10,
        lastVisit: '2026-01-01T10:45:00',
        segment: 'subscription-ending',
    },
    {
        id: '12',
        firstName: 'Лариса',
        lastName: 'Павленко',

        phone: '+380 50 678 90 12',
        totalSpent: 4100,
        totalVisits: 3,
        discount: 0,
        lastVisit: '2025-12-26T12:30:00',
        segment: 'repeat',
    },
    {
        id: '13',
        firstName: 'Алла',
        lastName: 'Кравченко',

        phone: '+380 93 567 89 01',
        email: 'alla.kravchenko@ukr.net',
        totalSpent: 1850,
        totalVisits: 1,
        discount: 0,
        lastVisit: '2026-01-03T09:00:00',
        segment: 'new',
    },
    {
        id: '14',
        firstName: 'Валентина',
        lastName: 'Романенко',

        phone: '+380 66 789 01 23',
        totalSpent: 21300,
        totalVisits: 17,
        discount: 15,
        lastVisit: '2024-09-08T14:20:00',
        segment: 'lost',
    },
    {
        id: '15',
        firstName: 'Ганна',
        lastName: 'Білоус',

        phone: '+380 99 012 34 56',
        email: 'hanna.bilous@gmail.com',
        totalSpent: 9500,
        totalVisits: 8,
        discount: 7,
        lastVisit: '2025-12-31T11:30:00',
        segment: 'repeat',
    },
];