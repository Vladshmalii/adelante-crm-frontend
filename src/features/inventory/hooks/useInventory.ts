import { useState, useEffect } from 'react';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { inventoryApi } from '@/lib/api/inventory';
import { MOCK_INVENTORY } from '../data/mockInventory';
import { USE_MOCK_DATA } from '@/lib/config';
import type { Product } from '../types';

interface UseInventoryOptions {
    search?: string;
    category?: string;
    type?: string;
    stockStatus?: string;
}

export function useInventory(options: UseInventoryOptions = {}) {
    const { products, setProducts, setLoading, isLoading } = useInventoryStore();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadProducts();
    }, [options.search, options.category, options.type, options.stockStatus]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Використовуємо мокові дані
                let filtered = [...MOCK_INVENTORY].map((p: any) => ({
                    ...p,
                    id: p.id,
                    isActive: p.isActive ?? true,
                }));

                // Фільтруємо по пошуку
                if (options.search) {
                    const search = options.search.toLowerCase();
                    filtered = filtered.filter(
                        (p) =>
                            p.name?.toLowerCase().includes(search) ||
                            p.sku?.toLowerCase().includes(search)
                    );
                }

                // Фільтруємо по категорії
                if (options.category) {
                    filtered = filtered.filter((p) => p.category === options.category);
                }

                // Фільтруємо по типу
                if (options.type) {
                    filtered = filtered.filter((p) => p.type === options.type);
                }

                // Фільтруємо по статусу залишків
                if (options.stockStatus === 'low') {
                    filtered = filtered.filter((p) => p.quantity <= p.minQuantity);
                } else if (options.stockStatus === 'out') {
                    filtered = filtered.filter((p) => p.quantity === 0);
                }

                // Імітуємо затримку мережі
                await new Promise((resolve) => setTimeout(resolve, 300));

                setProducts(filtered);
            } else {
                // Використовуємо реальний API
                const data = await inventoryApi.getProducts({
                    search: options.search,
                    category: options.category,
                    type: options.type,
                    stockStatus: options.stockStatus,
                });

                setProducts(data);
            }
        } catch (err) {
            console.error('Failed to load products:', err);
            setError(err instanceof Error ? err.message : 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const createProduct = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова логіка створення
                const newProduct: Product = {
                    ...data,
                    id: Date.now(),
                    createdAt: new Date().toISOString(),
                    isActive: data.isActive ?? true,
                };

                setProducts([...products, newProduct]);
                return newProduct;
            } else {
                // Реальний API
                const newProduct = await inventoryApi.createProduct(data);
                setProducts([...products, newProduct]);
                return newProduct;
            }
        } catch (err) {
            console.error('Failed to create product:', err);
            setError(err instanceof Error ? err.message : 'Failed to create product');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateProduct = async (id: string | number, data: Partial<Product>) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова логіка оновлення
                const updated = products.map((p) =>
                    p.id === id ? { ...p, ...data } : p
                );
                setProducts(updated);
            } else {
                // Реальний API
                const numId = typeof id === 'string' ? parseInt(id) : id;
                const updatedProduct = await inventoryApi.updateProduct(numId, data);
                const updated = products.map((p) =>
                    p.id === updatedProduct.id ? updatedProduct : p
                );
                setProducts(updated);
            }
        } catch (err) {
            console.error('Failed to update product:', err);
            setError(err instanceof Error ? err.message : 'Failed to update product');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (id: string | number) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова логіка видалення
                const filtered = products.filter((p) => p.id !== id);
                setProducts(filtered);
            } else {
                // Реальний API
                const numId = typeof id === 'string' ? parseInt(id) : id;
                await inventoryApi.deleteProduct(numId);
                const filtered = products.filter((p) => p.id !== id);
                setProducts(filtered);
            }
        } catch (err) {
            console.error('Failed to delete product:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete product');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createStockMovement = async (data: any) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова логіка руху товару
                const product = products.find((p) => p.id === data.productId);
                if (product) {
                    let newQuantity = product.quantity;
                    if (data.type === 'in') {
                        newQuantity += data.quantity;
                    } else if (data.type === 'out') {
                        newQuantity -= data.quantity;
                    } else if (data.type === 'adjustment') {
                        newQuantity = data.quantity;
                    }

                    const updated = products.map((p) =>
                        p.id === data.productId ? { ...p, quantity: newQuantity } : p
                    );
                    setProducts(updated);
                }

                await new Promise((resolve) => setTimeout(resolve, 300));
            } else {
                // Реальний API
                await inventoryApi.createStockMovement(data);
                // Перезавантажуємо продукти щоб отримати оновлені залишки
                await loadProducts();
            }
        } catch (err) {
            console.error('Failed to create stock movement:', err);
            setError(err instanceof Error ? err.message : 'Failed to create stock movement');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        products,
        isLoading,
        error,
        loadProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        createStockMovement,
    };
}

