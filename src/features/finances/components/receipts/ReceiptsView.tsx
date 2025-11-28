'use client';

import { useState } from 'react';
import { ReceiptsFilters } from './ReceiptsFilters';
import { ReceiptsTable } from './ReceiptsTable';
import { mockReceipts } from '../../data/mockReceipts';

export function ReceiptsView() {
    const [dateFrom, setDateFrom] = useState('2025-11-22');
    const [dateTo, setDateTo] = useState('2025-11-28');
    const [cashRegister, setCashRegister] = useState('all');
    const [employee, setEmployee] = useState('all');
    const [status, setStatus] = useState('all');

    const handleApply = () => {
        console.log('Applying filters...');
    };

    return (
        <div className="flex flex-col h-full">
            <ReceiptsFilters
                dateFrom={dateFrom}
                dateTo={dateTo}
                cashRegister={cashRegister}
                employee={employee}
                status={status}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onCashRegisterChange={setCashRegister}
                onEmployeeChange={setEmployee}
                onStatusChange={setStatus}
                onApply={handleApply}
            />
            <div className="flex-1 overflow-auto">
                <ReceiptsTable receipts={mockReceipts} />
            </div>
        </div>
    );
}