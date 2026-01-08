'use client';

import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { InventoryHeader } from './InventoryHeader';
import { InventoryFilters } from './InventoryFilters';
import { InventoryStats } from './InventoryStats';
import { InventoryTable } from './InventoryTable';
import { AddProductModal } from '../modals/AddProductModal';
import { EditProductModal } from '../modals/EditProductModal';
import { StockMovementModal } from '../modals/StockMovementModal';
import { ImportExcelModal } from '@/features/clients/modals/ImportExcelModal';
import { InventoryExportModal } from '../modals/InventoryExportModal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { Product, InventoryFilters as FilterType, AddProductFormData, StockMovementFormData, InventoryExportOptions } from '../types';
import { useInventory } from '../hooks/useInventory';
import { GlobalLoader } from '@/shared/components/ui/GlobalLoader';
import { USE_MOCK_DATA } from '@/lib/config';
import { inventoryApi } from '@/lib/api/inventory';

export function InventoryLayout() {
    const toast = useToast();
    const { products, isLoading, error, createProduct, updateProduct, deleteProduct, createStockMovement, loadProducts } = useInventory();
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<FilterType>({});

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    useEffect(() => {
        if (error) {
            toast.error('Помилка', error);
        }
    }, [error, toast]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSearch =
                    product.name.toLowerCase().includes(query) ||
                    product.sku.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            if (filters.category && filters.category !== 'all' && product.category !== filters.category) {
                return false;
            }

            if (filters.type && filters.type !== 'all' && product.type !== filters.type) {
                return false;
            }

            if (filters.stockStatus && filters.stockStatus !== 'all') {
                const isOut = product.quantity === 0;
                const isLow = product.quantity > 0 && product.quantity <= product.minQuantity;
                const isOk = product.quantity > product.minQuantity;

                if (filters.stockStatus === 'out' && !isOut) return false;
                if (filters.stockStatus === 'low' && !isLow) return false;
                if (filters.stockStatus === 'ok' && !isOk) return false;
            }

            return true;
        });
    }, [products, searchQuery, filters]);

    const handleAddProduct = async (data: AddProductFormData) => {
        try {
            await createProduct({
                ...data,
                quantity: data.quantity ?? 0,
                minQuantity: data.minQuantity ?? 0,
                costPrice: data.costPrice ?? 0,
                isActive: true,
            } as any);
            toast.success('Товар створено', 'Успіх');
            setIsAddModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error('Помилка', err instanceof Error ? err.message : 'Не вдалося створити товар');
        }
    };

    const handleEditProduct = async (id: string | number, data: AddProductFormData) => {
        if (!selectedProduct) return;
        try {
            await updateProduct(id, {
                ...data,
            } as any);
            toast.success('Товар оновлено', 'Успіх');
            setIsEditModalOpen(false);
            setSelectedProduct(null);
        } catch (err) {
            console.error(err);
            toast.error('Помилка', err instanceof Error ? err.message : 'Не вдалося оновити товар');
        }
    };

    const handleDeleteProduct = async () => {
        if (!selectedProduct) return;
        try {
            await deleteProduct(selectedProduct.id);
            toast.success('Товар видалено', 'Успіх');
            setIsDeleteModalOpen(false);
            setSelectedProduct(null);
        } catch (err) {
            console.error(err);
            toast.error('Помилка', err instanceof Error ? err.message : 'Не вдалося видалити товар');
        }
    };

    const handleStockMovement = async (data: StockMovementFormData) => {
        try {
            await createStockMovement({
                productId: data.productId,
                type: data.type,
                quantity: data.quantity,
                reason: data.reason,
            } as any);
            toast.success('Рух по складу оновлено', 'Успіх');
            setIsMovementModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error('Помилка', err instanceof Error ? err.message : 'Не вдалося оновити рух по складу');
        }
    };

    const openEditModal = (product: Product) => {
        setSelectedProduct(product);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (product: Product) => {
        setSelectedProduct(product);
        setIsDeleteModalOpen(true);
    };

    const openMovementModal = (product: Product) => {
        setSelectedProduct(product);
        setIsMovementModalOpen(true);
    };

    const handleImport = async (file: File) => {
        toast.info('Імпорт', USE_MOCK_DATA ? 'Демо режим: імпорт не виконується' : `Імпорт ${file.name}`);
    };

    const handleExport = async (options: InventoryExportOptions) => {
        try {
            if (!USE_MOCK_DATA) {
                const blob = await inventoryApi.exportProducts(options as any);
                const url = window.URL.createObjectURL(blob as any);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'inventory.xlsx';
                link.click();
                window.URL.revokeObjectURL(url);
            } else {
                toast.info('Демо режим', 'Експорт не виконується в демо режимі');
            }
        } catch (err) {
            console.error(err);
            toast.error('Помилка експорту', err instanceof Error ? err.message : 'Не вдалося експортувати');
        }
    };

    return (
        <div className="p-4 sm:p-6">
            <GlobalLoader isLoading={isLoading} />
            <InventoryHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddProduct={() => setIsAddModalOpen(true)}
                onImport={() => setIsImportModalOpen(true)}
                onExport={() => setIsExportModalOpen(true)}
            />

            <InventoryStats products={products} />

            <InventoryFilters
                filters={filters}
                onFiltersChange={setFilters}
            />

            <InventoryTable
                products={filteredProducts}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
                onMovement={openMovementModal}
            />

            <AddProductModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleAddProduct}
            />

            <EditProductModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleEditProduct}
                product={selectedProduct}
            />

            <StockMovementModal
                isOpen={isMovementModalOpen}
                onClose={() => setIsMovementModalOpen(false)}
                onSave={handleStockMovement}
                product={selectedProduct}
            />

            <ImportExcelModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImport}
            />

            <InventoryExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
            />

            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteProduct}
                title="Видалити товар?"
                message={`Ви впевнені, що хочете видалити товар "${selectedProduct?.name}"? Цю дію неможливо скасувати.`}
                confirmText="Видалити"
                cancelText="Скасувати"
                variant="danger"
            />
        </div>
    );
}
