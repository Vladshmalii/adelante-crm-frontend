'use client';

import { useState } from 'react';
import { OperationsFilters } from './OperationsFilters';
import { OperationsTable } from './OperationsTable';
import { mockOperations } from '../../data/mockOperations';

export function OperationsView() {
    const [dateFrom, setDateFrom] = useState('2025-11-22');
    const [dateTo, setDateTo] = useState('2025-11-28');
    const [operationType, setOperationType] = useState('all');
    const [cashRegister, setCashRegister] = useState('all');
    const [employee, setEmployee] = useState('all');
    const [clientSearch, setClientSearch] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('all');

    const handleApply = () => {
        console.log('Applying filters...');
    };

    return (
        <div className="flex flex-col h-full">
            <OperationsFilters
                dateFrom={dateFrom}
                dateTo={dateTo}
                operationType={operationType}
                cashRegister={cashRegister}
                employee={employee}
                clientSearch={clientSearch}
                paymentMethod={paymentMethod}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onOperationTypeChange={setOperationType}
                onCashRegisterChange={setCashRegister}
                onEmployeeChange={setEmployee}
                onClientSearchChange={setClientSearch}
                onPaymentMethodChange={setPaymentMethod}
                onApply={handleApply}
            />
            <div className="flex-1 overflow-auto">
                <OperationsTable operations={mockOperations} />
            </div>
        </div>
    );
}