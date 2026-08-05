import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Button } from '@/shared/components/ui/Button';
import { SlidersHorizontal, Search } from 'lucide-react';
import { RECEIPT_STATUSES } from '../../constants';
import { mockCashRegisters } from '../../data/mockCashRegisters';

interface ReceiptsFiltersProps {
    dateFrom: string;
    dateTo: string;
    cashRegister: string;
    employee: string;
    status: string;
    searchQuery: string;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
    onCashRegisterChange: (value: string) => void;
    onEmployeeChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onSearchQueryChange: (value: string) => void;
    onApply: () => void;
}

export function ReceiptsFilters({
    dateFrom,
    dateTo,
    cashRegister,
    employee,
    status,
    searchQuery,
    onDateFromChange,
    onDateToChange,
    onCashRegisterChange,
    onEmployeeChange,
    onStatusChange,
    onSearchQueryChange,
    onApply,
}: ReceiptsFiltersProps) {
    const cashRegisterOptions = [
        { value: 'all', label: 'Усі каси' },
        ...mockCashRegisters.map((cr) => ({ value: cr.id, label: cr.name })),
    ];

    const employeeOptions = [
        { value: 'all', label: 'Усі співробітники' },
        { value: 'emp1', label: 'Олена Петренко' },
        { value: 'emp2', label: 'Тетяна Іванова' },
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
                <div className="lg:col-span-2">
                    <label className="mb-1.5 ml-1 block text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                        Пошук за номером, документом або клієнтом
                    </label>
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={16}
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchQueryChange(e.target.value)}
                            placeholder="№ чека, № документа або ім'я клієнта..."
                            className="h-[42px] w-full rounded-xl border border-border/50 bg-background py-2 pl-9 pr-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>
                <div className="flex items-end">
                    <Button
                        onClick={onApply}
                        variant="primary"
                        className="h-[42px] w-full rounded-xl font-bold shadow-lg shadow-primary/10 transition-all active:scale-95"
                    >
                        Показати результати
                    </Button>
                </div>
            </div>
        </div>
    );
}
