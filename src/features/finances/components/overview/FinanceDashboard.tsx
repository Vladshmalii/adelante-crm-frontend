'use client';

import { useState } from 'react';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import FinanceKpiCards from './FinanceKpiCards';
import { FinanceChartsRow } from './FinanceChartsRow';
import { FinancePaymentSplit } from './FinancePaymentSplit';
import { mockCashRegisters } from '../../data/mockCashRegisters';

import { SlidersHorizontal } from 'lucide-react';

export function FinanceDashboard() {
    const [dateFrom, setDateFrom] = useState('2025-12-29');
    const [dateTo, setDateTo] = useState('2026-01-04');
    const [location, setLocation] = useState('all');
    const [cashRegister, setCashRegister] = useState('all');

    const locationOptions = [
        { value: 'all', label: 'Усі локації' },
        { value: 'central', label: 'Центральна локація' },
        { value: 'downtown', label: 'Центр міста' },
    ];

    const cashRegisterOptions = [
        { value: 'all', label: 'Усі каси' },
        ...mockCashRegisters.map(cr => ({ value: cr.id, label: cr.name })),
    ];

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border bg-card flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold font-heading text-foreground">Фінансовий огляд</h2>
            </div>

            <div className="flex-1 overflow-auto space-y-6 pb-6">
                <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50 mx-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <SlidersHorizontal size={18} />
                        </div>
                        <h3 className="font-bold text-foreground">Параметри огляду</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <DatePicker
                            label="Дата з"
                            value={dateFrom}
                            onChange={setDateFrom}
                        />
                        <DatePicker
                            label="Дата по"
                            value={dateTo}
                            onChange={setDateTo}
                        />
                        <Dropdown
                            label="Локація"
                            value={location}
                            options={locationOptions}
                            onChange={(val) => setLocation(val as string)}
                        />
                        <Dropdown
                            label="Каса"
                            value={cashRegister}
                            options={cashRegisterOptions}
                            onChange={(val) => setCashRegister(val as string)}
                        />
                    </div>
                </div>

                <div className="px-4 space-y-6">
                    <FinanceKpiCards />
                    <FinanceChartsRow />
                    <FinancePaymentSplit />
                </div>
            </div>
        </div>
    );
}