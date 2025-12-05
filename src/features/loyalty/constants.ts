export const LOYALTY_LEVELS = {
    bronze: { name: 'Бронза', minPoints: 0, color: 'bg-amber-700', textColor: 'text-amber-700' },
    silver: { name: 'Срібло', minPoints: 1000, color: 'bg-gray-400', textColor: 'text-gray-400' },
    gold: { name: 'Золото', minPoints: 5000, color: 'bg-yellow-500', textColor: 'text-yellow-500' },
    platinum: { name: 'Платина', minPoints: 15000, color: 'bg-indigo-400', textColor: 'text-indigo-400' },
};

export const DISCOUNT_TYPES = [
    { value: 'percentage', label: 'Відсоткова' },
    { value: 'fixed', label: 'Фіксована' },
];

export const APPLICABLE_TO_OPTIONS = [
    { value: 'all', label: 'Все' },
    { value: 'services', label: 'Послуги' },
    { value: 'products', label: 'Товари' },
];

export const STATUS_OPTIONS = [
    { value: 'all', label: 'Усі' },
    { value: 'active', label: 'Активні' },
    { value: 'inactive', label: 'Неактивні' },
    { value: 'expired', label: 'Прострочені' },
];

export const CERTIFICATE_AMOUNTS = [
    { value: 500, label: '500 ₴' },
    { value: 1000, label: '1000 ₴' },
    { value: 2000, label: '2000 ₴' },
    { value: 5000, label: '5000 ₴' },
];
