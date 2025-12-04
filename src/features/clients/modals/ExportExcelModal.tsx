'use client';

import { useState } from 'react';
import type { ExportExcelOptions } from '../types';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Checkbox } from '@/shared/components/ui/Checkbox';

interface ExportExcelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: ExportExcelOptions) => void;
}

export function ExportExcelModal({ isOpen, onClose, onExport }: ExportExcelModalProps) {
    const [options, setOptions] = useState<ExportExcelOptions>({
        includeVisits: false,
        includeProducts: false,
    });

    if (!isOpen) return null;

    const handleSubmit = () => {
        onExport(options);
        onClose();
    };

    const handleToggle = (field: keyof ExportExcelOptions) => {
        setOptions(prev => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Вивантажити в Excel" size="sm">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                        Оберіть дані для експорту
                    </label>

                    <div className="space-y-3">
                        <div className="p-3 rounded-lg border border-border bg-secondary/30">
                            <Checkbox
                                label="Основні дані клієнтів"
                                checked={true}
                                disabled
                            />
                            <p className="text-xs text-muted-foreground mt-1 ml-7">
                                Ім'я, телефон, email, знижка тощо
                            </p>
                        </div>

                        <div className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                            <Checkbox
                                label="Історія візитів"
                                checked={options.includeVisits}
                                onChange={() => handleToggle('includeVisits')}
                            />
                            <p className="text-xs text-muted-foreground mt-1 ml-7">
                                Дати, послуги, майстри
                            </p>
                        </div>

                        <div className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                            <Checkbox
                                label="Продані товари та послуги"
                                checked={options.includeProducts}
                                onChange={() => handleToggle('includeProducts')}
                            />
                            <p className="text-xs text-muted-foreground mt-1 ml-7">
                                Назва, кількість, сума
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Період (опціонально)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <DatePicker
                            label="З"
                            value={options.dateFrom || ''}
                            onChange={(value) => setOptions(prev => ({ ...prev, dateFrom: value }))}
                        />
                        <DatePicker
                            label="По"
                            value={options.dateTo || ''}
                            onChange={(value) => setOptions(prev => ({ ...prev, dateTo: value }))}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
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
                    Вивантажити
                </Button>
            </div>
        </Modal>
    );
}