import { ChevronDown, Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface DropdownOption {
    value: string | number;
    label: string;
}

interface DropdownProps {
    label?: string;
    placeholder?: string;
    value: string | number;
    options: DropdownOption[];
    onChange: (value: string | number) => void;
    searchable?: boolean;
    disabled?: boolean;
    error?: string;
}

export function Dropdown({
                             label,
                             placeholder = 'Оберіть...',
                             value,
                             options,
                             onChange,
                             searchable = false,
                             disabled = false,
                             error,
                         }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            if (searchable && searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, searchable]);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = searchable && searchQuery
        ? options.filter(opt =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : options;

    const handleSelect = (optionValue: string | number) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div ref={dropdownRef} className="relative">
            {label && (
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
          w-full flex items-center justify-between gap-2 px-3 py-2 text-sm
          bg-background border rounded-lg transition-colors
          ${disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-primary/50 cursor-pointer'
                }
          ${error ? 'border-destructive' : 'border-border'}
          ${isOpen ? 'ring-2 ring-ring border-transparent' : ''}
        `}
            >
        <span className={selectedOption ? 'text-foreground' : 'text-muted-foreground'}>
          {selectedOption?.label || placeholder}
        </span>
                <ChevronDown
                    size={16}
                    className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {error && (
                <p className="text-xs text-destructive mt-1">{error}</p>
            )}

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-hidden flex flex-col">
                    {searchable && (
                        <div className="p-2 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Пошук..."
                                    className="w-full pl-9 pr-3 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>
                    )}

                    <div className="overflow-y-auto scrollbar-thin">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={`
                    w-full px-3 py-2 text-left text-sm transition-colors
                    ${option.value === value
                                        ? 'bg-primary text-primary-foreground font-medium'
                                        : 'hover:bg-secondary text-foreground'
                                    }
                  `}
                                >
                                    {option.label}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                                Нічого не знайдено
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}