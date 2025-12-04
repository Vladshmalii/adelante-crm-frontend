export type ProductType = 'item' | 'weight';
export type ProductCategory = 'professional' | 'retail' | 'consumables' | 'equipment';
export type ProductUnit = 'pcs' | 'ml' | 'l' | 'g' | 'kg';
export type StockStatus = 'ok' | 'low' | 'out';

export interface Product {
    id: string;
    name: string;
    sku: string; // Артикул
    category: ProductCategory;
    type: ProductType;
    quantity: number;
    unit: ProductUnit;
    price: number; // Ціна закупівлі або продажу (залежить від контексту, візьмемо ціну продажу)
    costPrice: number; // Собівартість
    minQuantity: number; // Мінімальний залишок для сповіщення
    description?: string;
    lastRestockDate?: string;
}

export interface InventoryFilters {
    search?: string;
    category?: ProductCategory | 'all';
    type?: ProductType | 'all';
    stockStatus?: StockStatus | 'all';
}

export interface AddProductFormData {
    name: string;
    sku: string;
    category: ProductCategory;
    type: ProductType;
    quantity: number;
    unit: ProductUnit;
    price: number;
    costPrice: number;
    minQuantity: number;
    description?: string;
}

export interface StockMovementFormData {
    productId: string;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    reason?: string;
}

export interface InventoryExportOptions {
    includeBasicInfo: boolean; // Назва, Артикул, Категорія, Тип
    includeStockInfo: boolean; // Залишок, Од. виміру, Мін. залишок, Статус
    includeFinancialInfo: boolean; // Собівартість, Ціна, Загальна вартість
    includeDescription: boolean; // Опис
    category?: ProductCategory | 'all'; // Фільтр по категорії при експорті
}
