import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Button } from '@/shared/components/ui/Button';
import { Search } from 'lucide-react';
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
        <div className="p-4 bg-card border-b border-border">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
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
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        Пошук за номером
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchQueryChange(e.target.value)}
                            placeholder="Номер документа"
                            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>
                <div className="lg:col-span-2 flex items-end">
                    <Button onClick={onApply} fullWidth>
                        Показати
                    </Button>
                </div>
            </div>
        </div>
    );
}