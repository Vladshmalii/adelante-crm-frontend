import { create } from 'zustand';
import { inventoryApi, ProductFilters, StockMovement } from '@/lib/api/inventory';
import type { Product } from '@/features/inventory/types';

interface InventoryState {
    products: Product[];
    selectedProduct: Product | null;
    isLoading: boolean;
    filters: ProductFilters;

    setProducts: (products: Product[]) => void;
    setLoading: (value: boolean) => void;

    fetchProducts: (filters?: ProductFilters) => Promise<void>;
    createProduct: (data: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
    updateProduct: (id: string | number, data: Partial<Product>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    createStockMovement: (data: Omit<StockMovement, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
    exportProducts: (filters?: ProductFilters) => Promise<Blob>;
    setFilters: (filters: ProductFilters) => void;
    selectProduct: (product: Product | null) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
    products: [],
    selectedProduct: null,
    isLoading: false,
    filters: {},

    setProducts: (products) => set({ products }),
    setLoading: (value) => set({ isLoading: value }),

    fetchProducts: async (filters) => {
        set({ isLoading: true });
        try {
            const response = await inventoryApi.getProducts(filters);
            const list = Array.isArray(response) ? response : (response as any)?.data || [];
            set({ products: list });
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    createProduct: async (data) => {
        set({ isLoading: true });
        try {
            const payload = { isActive: true, ...data } as Omit<import('@/lib/api/inventory').Product, 'id' | 'createdAt' | 'updatedAt'>;
            const newProduct = await inventoryApi.createProduct(payload);
            set((state) => ({ products: [...state.products, newProduct] }));
        } catch (error) {
            console.error('Failed to create product:', error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateProduct: async (id, data) => {
        set({ isLoading: true });
        try {
            const numId = typeof id === 'string' ? parseInt(id) : id;
            const payload = { ...data } as Partial<import('@/lib/api/inventory').Product>;
            const updatedProduct = await inventoryApi.updateProduct(numId, payload);
            set((state) => ({
                products: state.products.map((p) => (p.id === id ? updatedProduct : p)),
                selectedProduct: state.selectedProduct?.id === id ? updatedProduct : state.selectedProduct
            }));
        } catch (error) {
            console.error(`Failed to update product with id ${id}:`, error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteProduct: async (id) => {
        set({ isLoading: true });
        try {
            const numId = typeof id === 'string' ? parseInt(id) : id;
            const targetId = String(id);
            await inventoryApi.deleteProduct(numId);
            set((state) => ({
                products: state.products.filter((p) => String(p.id) !== targetId),
                selectedProduct: state.selectedProduct?.id === id ? null : state.selectedProduct
            }));
        } catch (error) {
            console.error(`Failed to delete product with id ${id}:`, error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    createStockMovement: async (data) => {
        set({ isLoading: true });
        try {
            await inventoryApi.createStockMovement(data);
            // We might need to refresh the specific product to show updated quantity
            if (data.productId) {
                const updatedProduct = await inventoryApi.getProductById(data.productId);
                set((state) => ({
                    products: state.products.map((p) => (p.id === data.productId ? updatedProduct : p)),
                    selectedProduct: state.selectedProduct?.id === data.productId ? updatedProduct : state.selectedProduct
                }));
            }

        } catch (error) {
            console.error('Failed to create stock movement:', error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    exportProducts: async (filters) => {
        set({ isLoading: true });
        try {
            return await inventoryApi.exportProducts(filters);
        } catch (error) {
            console.error('Failed to export products:', error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    setFilters: (filters) => set({ filters }),
    selectProduct: (product) => set({ selectedProduct: product }),
}));
