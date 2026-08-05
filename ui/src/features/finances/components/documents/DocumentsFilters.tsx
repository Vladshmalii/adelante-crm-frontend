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
                    <label className="mb-1.5 ml-1 block text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                        Пошук за номером або контрагентом
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
                            placeholder="Номер документа або ім'я..."
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
                        Показати
                    </Button>
                </div>
            </div>
        </div>
    );
}
