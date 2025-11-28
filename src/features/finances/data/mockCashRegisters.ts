import { CashRegister } from '../types';

export const mockCashRegisters: CashRegister[] = [
    {
        id: '1',
        name: 'Каса 1',
        location: 'Центральна локація',
        balance: 25430,
        isActive: true,
    },
    {
        id: '2',
        name: 'Каса 2',
        location: 'Центральна локація',
        balance: 18750,
        isActive: true,
    },
    {
        id: '3',
        name: 'Онлайн каса',
        location: 'Віртуальна',
        balance: 45200,
        isActive: true,
    },
    {
        id: '4',
        name: 'Віртуальна каса',
        location: 'Віртуальна',
        balance: 0,
        isActive: true,
    },
];