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
        ...mockCashRegisters.map(cr => ({ value: cr.id, label: cr.name })),
    ];

    const employeeOptions = [
        { value: 'all', label: 'Усі співробітники' },
        { value: 'emp1', label: 'Олена Петренко' },
        { value: 'emp2', label: 'Тетяна Іванова' },
    ];

    return (
        <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50 mb-6 mx-4">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <SlidersHorizontal size={18} />
                </div>
                <h3 className="font-bold text-foreground">Параметри фільтрації</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="lg:col-span-2">
                    <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">
                        Пошук за номером, документом або клієнтом
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchQueryChange(e.target.value)}
                            placeholder="№ чека, № документа або ім'я клієнта..."
                            className="w-full h-[42px] pl-9 pr-3 py-2 text-sm bg-background border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                </div>
                <div className="flex items-end">
                    <Button 
                        onClick={onApply} 
                        variant="primary"
                        className="h-[42px] w-full rounded-xl font-bold shadow-lg shadow-primary/10 active:scale-95 transition-all"
                    >
                        Показати результати
                    </Button>
                </div>
            </div>
        </div>
    );
}