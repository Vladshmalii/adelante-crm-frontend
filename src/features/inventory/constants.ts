import { ProductCategory, ProductUnit, StockStatus } from './types';

export const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
    { value: 'professional', label: 'Професійна косметика' },
    { value: 'retail', label: 'Товари для продажу' },
    { value: 'consumables', label: 'Витратні матеріали' },
    { value: 'equipment', label: 'Обладнання' },
];

export const PRODUCT_UNITS: { value: ProductUnit; label: string }[] = [
    { value: 'pcs', label: 'шт.' },
    { value: 'ml', label: 'мл' },
    { value: 'l', label: 'л' },
    { value: 'g', label: 'г' },
    { value: 'kg', label: 'кг' },
];

export const STOCK_STATUSES: { value: StockStatus; label: string; color: string }[] = [
    { value: 'ok', label: 'В наявності', color: 'success' },
    { value: 'low', label: 'Закінчується', color: 'warning' },
    { value: 'out', label: 'Немає в наявності', color: 'danger' },
];
