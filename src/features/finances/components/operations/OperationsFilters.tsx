import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Button } from '@/shared/components/ui/Button';
import { Search } from 'lucide-react';
import { OPERATION_TYPES, OPERATION_STATUSES } from '../../constants';
import { mockCashRegisters } from '../../data/mockCashRegisters';
import { mockPaymentMethods } from '../../data/mockPaymentMethods';

interface OperationsFiltersProps {
    dateFrom: string;
    dateTo: string;
    operationType: string;
    cashRegister: string;
    employee: string;
    clientSearch: string;
    paymentMethod: string;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
    onOperationTypeChange: (value: string) => void;
    onCashRegisterChange: (value: string) => void;
    onEmployeeChange: (value: string) => void;
    onClientSearchChange: (value: string) => void;
    onPaymentMethodChange: (value: string) => void;
    onApply: () => void;
}

export function OperationsFilters({
                                      dateFrom,
                                      dateTo,
                                      operationType,
                                      cashRegister,
                                      employee,
                                      clientSearch,
                                      paymentMethod,
                                      onDateFromChange,
                                      onDateToChange,
                                      onOperationTypeChange,
                                      onCashRegisterChange,
                                      onEmployeeChange,
                                      onClientSearchChange,
                                      onPaymentMethodChange,
                                      onApply,
                                  }: OperationsFiltersProps) {
    const cashRegisterOptions = [
        { value: 'all', label: 'Усі каси' },
        ...mockCashRegisters.map(cr => ({ value: cr.id, label: cr.name })),
    ];

    const employeeOptions = [
        { value: 'all', label: 'Усі співробітники' },
        { value: 'emp1', label: 'Олена Петренко' },
        { value: 'emp2', label: 'Тетяна Іванова' },
    ];

    const paymentMethodOptions = [
        { value: 'all', label: 'Усі методи' },
        ...mockPaymentMethods.map(pm => ({ value: pm.id, label: pm.name })),
    ];

    return (
        <div className="p-4 bg-card border-b border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <DatePicker
                    label="Дата з"
                    value={dateFrom}
                    onChange={onDateFromChange}
                />
                <DatePicker
                    label="Дата по"
                    value={dateTo}
                    onChange={onDateToChange}
                />
                <Dropdown
                    label="Вид операції"
                    value={operationType}
                    options={OPERATION_TYPES}
                    onChange={(val) => onOperationTypeChange(val as string)}
                />
                <Dropdown
                    label="Каса"
                    value={cashRegister}
                    options={cashRegisterOptions}
                    onChange={(val) => onCashRegisterChange(val as string)}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Dropdown
                    label="Співробітник"
                    value={employee}
                    options={employeeOptions}
                    onChange={(val) => onEmployeeChange(val as string)}
                />
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        Клієнт
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            value={clientSearch}
                            onChange={(e) => onClientSearchChange(e.target.value)}
                            placeholder="Ім'я або телефон"
                            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>
                <Dropdown
                    label="Метод оплати"
                    value={paymentMethod}
                    options={paymentMethodOptions}
                    onChange={(val) => onPaymentMethodChange(val as string)}
                />
                <div className="flex items-end">
                    <Button onClick={onApply} fullWidth>
                        Показати
                    </Button>
                </div>
            </div>
        </div>
    );
}