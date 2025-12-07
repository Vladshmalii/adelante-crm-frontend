import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Button } from '@/shared/components/ui/Button';
import { RECEIPT_STATUSES } from '../../constants';
import { mockCashRegisters } from '../../data/mockCashRegisters';

interface ReceiptsFiltersProps {
    dateFrom: string;
    dateTo: string;
    cashRegister: string;
    employee: string;
    status: string;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
    onCashRegisterChange: (value: string) => void;
    onEmployeeChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onApply: () => void;
}

export function ReceiptsFilters({
    dateFrom,
    dateTo,
    cashRegister,
    employee,
    status,
    onDateFromChange,
    onDateToChange,
    onCashRegisterChange,
    onEmployeeChange,
    onStatusChange,
    onApply,
}: ReceiptsFiltersProps) {
    const cashRegisterOptions = [
        { value: 'all', label: 'Усі каси' },
        ...mockCashRegisters.map(cr => ({ value: cr.id, label: cr.name })),
    ];

    const employeeOptions = [
        { value: 'all', label: 'Усі співробітники' },
        { value: 'emp1', label: 'Олена Петренко' },
        { value: 'emp2', label: 'Тетяна Іванова' },
    ];

    return (
        <div className="p-4 bg-card border-b border-border">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                    label="Каса"
                    value={cashRegister}
                    options={cashRegisterOptions}
                    onChange={(val) => onCashRegisterChange(val as string)}
                />
                <Dropdown
                    label="Співробітник"
                    value={employee}
                    options={employeeOptions}
                    onChange={(val) => onEmployeeChange(val as string)}
                />
                <Dropdown
                    label="Статус чеку"
                    value={status}
                    options={RECEIPT_STATUSES}
                    onChange={(val) => onStatusChange(val as string)}
                />
            </div>
            <div className="mt-3">
                <Button onClick={onApply} fullWidth>
                    Показати
                </Button>
            </div>
        </div>
    );
}