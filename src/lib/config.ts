/**
 * Конфігурація додатку
 * 
 * USE_MOCK_DATA:
 * - true: використовувати мокові дані (для демо заказчику)
 * - false: використовувати реальний API
 */

const envUseMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA;

export const config = {
    // API URL
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    
    // Режим демо - показувати мокові дані
    // true  -> моки, false -> реальний API
    USE_MOCK_DATA: envUseMock ? envUseMock === 'true' : false,
    
    // WebSocket URL
    WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws',
    
    // Base path для деплою на GitHub Pages або інших субшляхах
    BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || '',
} as const;

// Експортуємо для зручності
export const { API_URL, USE_MOCK_DATA, WS_URL, BASE_PATH } = config;

