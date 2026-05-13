import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Button } from '@/shared/components/ui/Button';
import { Search, SlidersHorizontal } from 'lucide-react';
import { DOCUMENT_TYPES, DOCUMENT_CONTENT_TYPES } from '../../constants';

interface DocumentsFiltersProps {
    dateFrom: string;
    dateTo: string;
    documentType: string;
    contentType: string;
    searchQuery: string;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
    onDocumentTypeChange: (value: string) => void;
    onContentTypeChange: (value: string) => void;
    onSearchQueryChange: (value: string) => void;
    onApply: () => void;
}

export function DocumentsFilters({
    dateFrom,
    dateTo,
    documentType,
    contentType,
    searchQuery,
    onDateFromChange,
    onDateToChange,
    onDocumentTypeChange,
    onContentTypeChange,
    onSearchQueryChange,
    onApply,
}: DocumentsFiltersProps) {
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
                    label="Вид документа"
                    value={documentType}
                    options={DOCUMENT_TYPES}
                    onChange={(val) => onDocumentTypeChange(val as string)}
                />
                <Dropdown
                    label="Вид вмісту"
                    value={contentType}
                    options={DOCUMENT_CONTENT_TYPES}
                    onChange={(val) => onContentTypeChange(val as string)}
                />
                <div className="lg:col-span-3">
                    <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">
                        Пошук за номером або контрагентом
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchQueryChange(e.target.value)}
                            placeholder="Номер документа або ім'я..."
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
                        Показати
                    </Button>
                </div>
            </div>
        </div>
    );
}