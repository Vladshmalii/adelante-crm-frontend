// Глобальні константи проекту

export const APP_NAME = 'Adelante CRM';
export const APP_VERSION = '1.0.0';

// Формати дати
export const DATE_FORMAT = 'dd.MM.yyyy';
export const DATE_TIME_FORMAT = 'dd.MM.yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// Пагінація
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Валідація
export const MIN_PHONE_LENGTH = 10;
export const MAX_PHONE_LENGTH = 13;
export const MIN_PASSWORD_LENGTH = 6;

// Робочі години
export const WORK_START_HOUR = 9;
export const WORK_END_HOUR = 21;
export const TIME_SLOT_DURATION = 30; // хвилини

// Валюта
export const CURRENCY_SYMBOL = '₴';
export const CURRENCY_CODE = 'UAH';

// Локаль
export const DEFAULT_LOCALE = 'uk-UA';

// API
export const API_TIMEOUT = 30000; // 30 секунд
export const API_RETRY_COUNT = 3;

// LocalStorage ключі
export const STORAGE_KEYS = {
    USER: 'adelante_user',
    TOKEN: 'adelante_token',
    THEME: 'adelante_theme',
    SETTINGS: 'adelante_settings',
} as const;

// Дебаунс затримки
export const SEARCH_DEBOUNCE_MS = 300;
export const INPUT_DEBOUNCE_MS = 500;
