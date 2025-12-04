import { ProductCategory, ProductType, ProductUnit, StockStatus } from './types';

export const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
    { value: 'professional', label: 'Професійна косметика' },
    { value: 'retail', label: 'Товари для продажу' },
    { value: 'consumables', label: 'Витратні матеріали' },
    { value: 'equipment', label: 'Обладнання' },
];

export const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
    { value: 'item', label: 'Штучний товар' },
    { value: 'weight', label: 'На розвіс/розлив' },
];

export const PRODUCT_UNITS: { value: ProductUnit; label: string; type: ProductType[] }[] = [
    { value: 'pcs', label: 'шт.', type: ['item'] },
    { value: 'ml', label: 'мл', type: ['weight'] },
    { value: 'l', label: 'л', type: ['weight'] },
    { value: 'g', label: 'г', type: ['weight'] },
    { value: 'kg', label: 'кг', type: ['weight'] },
];

export const STOCK_STATUSES: { value: StockStatus; label: string; color: string }[] = [
    { value: 'ok', label: 'В наявності', color: 'success' },
    { value: 'low', label: 'Закінчується', color: 'warning' },
    { value: 'out', label: 'Немає в наявності', color: 'danger' },
];
