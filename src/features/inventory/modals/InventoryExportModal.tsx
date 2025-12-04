'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { InventoryExportOptions, ProductCategory } from '../types';
import { PRODUCT_CATEGORIES } from '../constants';

interface InventoryExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: InventoryExportOptions) => void;
}

export function InventoryExportModal({ isOpen, onClose, onExport }: InventoryExportModalProps) {
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
        setOptions(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleCategoryChange = (value: string | number) => {
        setOptions(prev => ({ ...prev, category: String(value) as ProductCategory | 'all' }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Експорт складу в Excel">
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                        Оберіть дані для експорту
                    </label>

                    <div className="space-y-3">
                        <div className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                            <Checkbox
                                label="Основна інформація"
                                checked={options.includeBasicInfo}
                                onChange={(e) => handleToggle('includeBasicInfo')}
                            />
                            <p className="text-xs text-muted-foreground mt-1 ml-7">
                                Назва, Артикул, Категорія, Тип товару
                            </p>
                        </div>

                        <div className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                            <Checkbox
                                label="Складські дані"
                                checked={options.includeStockInfo}
                                onChange={(e) => handleToggle('includeStockInfo')}
                            />
                            <p className="text-xs text-muted-foreground mt-1 ml-7">
                                Поточний залишок, Одиниця виміру, Мін. залишок, Статус
                            </p>
                        </div>

                        <div className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                            <Checkbox
                                label="Фінансова інформація"
                                checked={options.includeFinancialInfo}
                                onChange={(e) => handleToggle('includeFinancialInfo')}
                            />
                            <p className="text-xs text-muted-foreground mt-1 ml-7">
                                Собівартість, Ціна продажу, Загальна вартість залишку
                            </p>
                        </div>

                        <div className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                            <Checkbox
                                label="Опис товару"
                                checked={options.includeDescription}
                                onChange={(e) => handleToggle('includeDescription')}
                            />
                            <p className="text-xs text-muted-foreground mt-1 ml-7">
                                Детальний опис та примітки
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <Dropdown
                        label="Фільтр по категорії (опціонально)"
                        value={options.category || 'all'}
                        options={[{ value: 'all', label: 'Всі категорії' }, ...PRODUCT_CATEGORIES]}
                        onChange={handleCategoryChange}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                    >
                        Скасувати
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                    >
                        Експортувати
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
