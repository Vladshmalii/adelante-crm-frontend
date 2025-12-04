import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, X, Search } from 'lucide-react';
import clsx from 'clsx';

export interface SelectOption {
    value: string;
    label: string;
    group?: string;
    disabled?: boolean;
}

interface SelectProps {
    options: SelectOption[];
    value?: string | string[];
    onChange: (value: string | string[]) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    multiple?: boolean;
    searchable?: boolean;
    disabled?: boolean;
    className?: string;
    renderOption?: (option: SelectOption) => ReactNode;
}

export function Select({
    options,
    value,
    onChange,
    placeholder = 'Оберіть опцію',
    label,
    error,
    multiple = false,
    searchable = false,
    disabled = false,
    className,
    renderOption,
}: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const filteredOptions = searchable
        ? options.filter((option) =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : options;

    const groupedOptions = filteredOptions.reduce((acc, option) => {
        const group = option.group || 'default';
        if (!acc[group]) acc[group] = [];
        acc[group].push(option);
        return acc;
    }, {} as Record<string, SelectOption[]>);

    const handleSelect = (optionValue: string) => {
        if (multiple) {
            const newValue = selectedValues.includes(optionValue)
                ? selectedValues.filter((v) => v !== optionValue)
                : [...selectedValues, optionValue];
            onChange(newValue);
        } else {
            onChange(optionValue);
            setIsOpen(false);
        }
    };

    const handleRemove = (optionValue: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (multiple) {
            onChange(selectedValues.filter((v) => v !== optionValue));
        } else {
            onChange('');
        }
    };

    const getSelectedLabels = () => {
        return options
            .filter((opt) => selectedValues.includes(opt.value))
            .map((opt) => opt.label);
    };

    const selectedLabels = getSelectedLabels();

    return (
        <div className={clsx('w-full', className)}>
            {label && (
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    {label}
                </label>
            )}

            <button
                ref={triggerRef}
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={clsx(
                    'w-full px-3 py-2 rounded-lg border transition-all duration-200',
                    'bg-background text-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'flex items-center justify-between gap-2',
                    error
                        ? 'border-destructive focus:ring-destructive/20'
                        : 'border-border hover:border-primary/50'
                )}
            >
                <div className="flex-1 flex items-center gap-1 flex-wrap min-h-[1.5rem]">
                    {selectedLabels.length > 0 ? (
                        multiple ? (
                            selectedLabels.map((label, index) => {
                                const option = options.find((opt) => opt.label === label);
                                return (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-sm"
                                    >
                                        {label}
                                        <X
                                            className="h-3 w-3 cursor-pointer hover:text-primary/70"
                                            onClick={(e) => handleRemove(option!.value, e)}
                                        />
                                    </span>
                                );
                            })
                        ) : (
                            <span className="text-foreground">{selectedLabels[0]}</span>
                        )
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                </div>
                <ChevronDown
                    className={clsx(
                        'h-4 w-4 text-muted-foreground transition-transform duration-200',
                        isOpen && 'rotate-180'
                    )}
                />
            </button>

            {error && (
                <p className="mt-1.5 text-sm text-destructive animate-fade-in">{error}</p>
            )}

            {isOpen &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className="fixed z-[9999] bg-card border border-border rounded-lg shadow-lg animate-fade-in-down overflow-hidden"
                        style={{
                            top: `${position.top}px`,
                            left: `${position.left}px`,
                            width: `${position.width}px`,
                            maxHeight: '300px',
                        }}
                    >
                        {searchable && (
                            <div className="p-2 border-b border-border">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Пошук..."
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="overflow-y-auto max-h-[250px] scrollbar-thin">
                            {Object.entries(groupedOptions).map(([group, groupOptions]) => (
                                <div key={group}>
                                    {group !== 'default' && (
                                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                                            {group}
                                        </div>
                                    )}
                                    {groupOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => !option.disabled && handleSelect(option.value)}
                                            disabled={option.disabled}
                                            className={clsx(
                                                'w-full px-3 py-2 text-left flex items-center justify-between gap-2',
                                                'transition-colors duration-150',
                                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                                selectedValues.includes(option.value)
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'hover:bg-accent hover:text-accent-foreground'
                                            )}
                                        >
                                            {renderOption ? (
                                                renderOption(option)
                                            ) : (
                                                <span>{option.label}</span>
                                            )}
                                            {selectedValues.includes(option.value) && (
                                                <Check className="h-4 w-4" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ))}

                            {filteredOptions.length === 0 && (
                                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                                    Нічого не знайдено
                                </div>
                            )}
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}
