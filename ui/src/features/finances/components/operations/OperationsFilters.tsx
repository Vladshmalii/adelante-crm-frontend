import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Button } from '@/shared/components/ui/Button';
import { Search, SlidersHorizontal } from 'lucide-react';
import { OPERATION_TYPES } from '../../constants';
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
        ...mockCashRegisters.map((cr) => ({ value: cr.id, label: cr.name })),
    ];

    const employeeOptions = [
        { value: 'all', label: 'Усі співробітники' },
        { value: 'emp1', label: 'Олена Петренко' },
        { value: 'emp2', label: 'Тетяна Іванова' },
    ];

    const paymentMethodOptions = [
        { value: 'all', label: 'Усі методи' },
        ...mockPaymentMethods.map((pm) => ({ value: pm.id, label: pm.name || '—' })),
    ];

    return (
        <div className="mx-4 mb-6 rounded-2xl border border-border/50 bg-secondary/30 p-5">
            <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <SlidersHorizontal size={18} />
                </div>
                <h3 className="font-bold text-foreground">Параметри фільтрації</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <DatePicker label="Дата з" value={dateFrom} onChange={onDateFromChange} />
                <DatePicker label="Дата по" value={dateTo} onChange={onDateToChange} />
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
                <Dropdown
                    label="Співробітник"
                    value={employee}
                    options={employeeOptions}
                    onChange={(val) => onEmployeeChange(val as string)}
                />
                <div>
                    <label className="mb-1.5 ml-1 block text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                        Клієнт
                    </label>
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={16}
                        />
                        <input
                            type="text"
                            value={clientSearch}
                            onChange={(e) => onClientSearchChange(e.target.value)}
                            placeholder="Ім'я або телефон"
                            className="h-[42px] w-full rounded-xl border border-border/50 bg-background py-2 pl-9 pr-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                    <Button
                        onClick={onApply}
                        fullWidth
                        variant="primary"
                        className="h-[42px] rounded-xl font-bold shadow-lg shadow-primary/10 transition-all active:scale-95"
                    >
                        Показати
                    </Button>
                </div>
            </div>
        </div>
    );
}
