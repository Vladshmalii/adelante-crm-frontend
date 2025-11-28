'use client';

import { useState } from 'react';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import FinanceKpiCards from './FinanceKpiCards';
import { FinanceChartsRow } from './FinanceChartsRow';
import { FinancePaymentSplit } from './FinancePaymentSplit';
import { mockCashRegisters } from '../../data/mockCashRegisters';

export function FinanceDashboard() {
    const [dateFrom, setDateFrom] = useState('2025-11-22');
    const [dateTo, setDateTo] = useState('2025-11-28');
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
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
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

            <FinanceKpiCards />
            <FinanceChartsRow />
            <FinancePaymentSplit />
        </div>
    );
}