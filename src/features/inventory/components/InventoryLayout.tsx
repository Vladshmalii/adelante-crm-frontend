'use client';

import { useState, useMemo } from 'react';
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
import { MOCK_INVENTORY } from '../data/mockInventory';
import { Product, InventoryFilters as FilterType, AddProductFormData, StockMovementFormData, InventoryExportOptions } from '../types';

export function InventoryLayout() {
    const toast = useToast();
    const [products, setProducts] = useState<Product[]>(MOCK_INVENTORY);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<FilterType>({});

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

    const handleAddProduct = (data: AddProductFormData) => {
        const newProduct: Product = {
            id: Date.now().toString(),
            ...data,
        };
        setProducts([...products, newProduct]);
    };

    const handleEditProduct = (id: string, data: AddProductFormData) => {
        setProducts(products.map(p => p.id === id ? { ...p, ...data } : p));
    };

    const handleDeleteProduct = () => {
        if (selectedProduct) {
            setProducts(products.filter(p => p.id !== selectedProduct.id));
            toast.success('Товар видалено', 'Успіх');
            setIsDeleteModalOpen(false);
            setSelectedProduct(null);
        }
    };

    const handleStockMovement = (data: StockMovementFormData) => {
        setProducts(products.map(p => {
            if (p.id === data.productId) {
                let newQuantity = p.quantity;
                if (data.type === 'in') newQuantity += data.quantity;
                if (data.type === 'out') newQuantity = Math.max(0, newQuantity - data.quantity);
                if (data.type === 'adjustment') newQuantity = data.quantity;

                return { ...p, quantity: newQuantity };
            }
            return p;
        }));
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

    const handleImport = (file: File) => {
        console.log('Importing file:', file.name);
    };

    const handleExport = (options: InventoryExportOptions) => {
        console.log('Exporting inventory with options:', options);
    };

    return (
        <div className="p-6">
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
