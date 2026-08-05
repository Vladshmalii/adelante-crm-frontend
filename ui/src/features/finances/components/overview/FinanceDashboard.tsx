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
        ...mockCashRegisters.map((cr) => ({ value: cr.id, label: cr.name })),
    ];

    return (
        <div className="flex h-full flex-col">
            <div className="mb-6 flex items-center justify-between border-b border-border bg-card p-4">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                    Фінансовий огляд
                </h2>
            </div>

            <div className="flex-1 space-y-6 overflow-auto pb-6">
                <div className="mx-4 rounded-2xl border border-border/50 bg-secondary/30 p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                            <SlidersHorizontal size={18} />
                        </div>
                        <h3 className="font-bold text-foreground">Параметри огляду</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <DatePicker label="Дата з" value={dateFrom} onChange={setDateFrom} />
                        <DatePicker label="Дата по" value={dateTo} onChange={setDateTo} />
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

                <div className="space-y-6 px-4">
                    <FinanceKpiCards />
                    <FinanceChartsRow />
                    <FinancePaymentSplit />
                </div>
            </div>
        </div>
    );
}
