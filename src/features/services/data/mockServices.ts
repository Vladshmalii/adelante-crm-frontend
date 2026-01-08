import type { Service } from '../types';

export const MOCK_SERVICES: Service[] = [
    // Чоловіча категорія
    { id: '1', name: 'Чоловіча стрижка (класика)', category: 'Чоловічий зал', duration: 45, price: 350, status: 'active', isActive: true, color: '#3b82f6' },
    { id: '2', name: 'Стрижка бороди та вусів', category: 'Чоловічий зал', duration: 30, price: 200, status: 'active', isActive: true, color: '#06b6d4' },
    { id: '3', name: 'Королівське гоління', category: 'Чоловічий зал', duration: 40, price: 400, status: 'active', isActive: true, color: '#0ea5e9' },

    // Жіноча категорія
    { id: '4', name: 'Жіноча стрижка', category: 'Жіночий зал', duration: 60, price: 500, status: 'active', isActive: true, color: '#ec4899' },
    { id: '5', name: 'Укладка волосся', category: 'Жіночий зал', duration: 45, price: 300, status: 'active', isActive: true, color: '#f472b6' },
    { id: '6', name: 'Фарбування в один тон', category: 'Жіночий зал', duration: 120, price: 1200, status: 'active', isActive: true, color: '#d946ef' },
    { id: '7', name: 'Складне фарбування (AirTouch)', category: 'Жіночий зал', duration: 240, price: 3500, status: 'active', isActive: true, color: '#a855f7' },

    // Манікюр
    { id: '8', name: 'Манікюр з покриттям гель-лак', category: 'Нігтьовий сервіс', duration: 90, price: 450, status: 'active', isActive: true, color: '#f43f5e' },
    { id: '9', name: 'Педикюр комбінований', category: 'Нігтьовий сервіс', duration: 90, price: 600, status: 'active', isActive: true, color: '#ef4444' },
    { id: '10', name: 'Укріплення нігтів', category: 'Нігтьовий сервіс', duration: 30, price: 200, status: 'active', isActive: true, color: '#fb7185' },

    // Догляд
    { id: '11', name: 'Чистка обличчя (ультразвукова)', category: 'Косметологія', duration: 60, price: 800, status: 'active', isActive: true, color: '#10b981' },
    { id: '12', name: 'Пілінг обличчя', category: 'Косметологія', duration: 45, price: 700, status: 'active', isActive: true, color: '#059669' },
];
