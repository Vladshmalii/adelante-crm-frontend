'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { InventoryExportOptions, ProductCategory } from '../types';
import { useInventoryStore } from '@/stores/useInventoryStore';

interface InventoryExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: InventoryExportOptions) => void;
}

export function InventoryExportModal({ isOpen, onClose, onExport }: InventoryExportModalProps) {
    const categories = useInventoryStore((state) => state.categories);
    const [options, setOptions] = useState<InventoryExportOptions>({
        includeBasicInfo: true,
        includeStockInfo: true,
        includeFinancialInfo: true,
        includeDescription: false,
        category: 'all',
    });

    if (!isOpen) return null;

    const handleSubmit = () => {
        onExport(options);
        onClose();
    };

    const handleToggle = (field: keyof Omit<InventoryExportOptions, 'category'>) => {
        setOptions((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const handleCategoryChange = (value: string | number) => {
        setOptions((prev) => ({ ...prev, category: String(value) as ProductCategory | 'all' }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Експорт складу в Excel">
            <div className="space-y-6">
                <div>
                    <label className="mb-3 block text-sm font-medium text-foreground">
                        Оберіть дані для експорту
                    </label>

                    <div className="space-y-3">
                        <div className="rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50">
                            <Checkbox
                                label="Основна інформація"
                                checked={options.includeBasicInfo}
                                onChange={(e) => handleToggle('includeBasicInfo')}
                            />
                            <p className="ml-7 mt-1 text-xs text-muted-foreground">
                                Назва, Артикул, Категорія
                            </p>
                        </div>

                        <div className="rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50">
                            <Checkbox
                                label="Складські дані"
                                checked={options.includeStockInfo}
                                onChange={(e) => handleToggle('includeStockInfo')}
                            />
                            <p className="ml-7 mt-1 text-xs text-muted-foreground">
                                Поточний залишок, Одиниця виміру, Мін. залишок, Статус
                            </p>
                        </div>

                        <div className="rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50">
                            <Checkbox
                                label="Фінансова інформація"
                                checked={options.includeFinancialInfo}
                                onChange={(e) => handleToggle('includeFinancialInfo')}
                            />
                            <p className="ml-7 mt-1 text-xs text-muted-foreground">
                                Собівартість, Ціна продажу, Загальна вартість залишку
                            </p>
                        </div>

                        <div className="rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50">
                            <Checkbox
                                label="Опис товару"
                                checked={options.includeDescription}
                                onChange={(e) => handleToggle('includeDescription')}
                            />
                            <p className="ml-7 mt-1 text-xs text-muted-foreground">
                                Детальний опис та примітки
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <Dropdown
                        label="Фільтр по категорії (опціонально)"
                        value={options.category || 'all'}
                        options={[{ value: 'all', label: 'Всі категорії' }, ...categories]}
                        onChange={handleCategoryChange}
                    />
                </div>

                <div className="flex justify-end gap-3 border-t border-border pt-4">
                    <Button variant="secondary" onClick={onClose}>
                        Скасувати
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        Експортувати
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
