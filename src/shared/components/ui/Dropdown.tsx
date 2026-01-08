import { ChevronDown, Search, Check, X } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

export interface DropdownOption {
    value: string | number;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    group?: string;
}

interface DropdownProps {
    label?: string;
    placeholder?: string;
    value: string | number | (string | number)[];
    options: DropdownOption[];
    onChange: (value: any) => void;
    searchable?: boolean;
    disabled?: boolean;
    error?: string;
    multiple?: boolean;
    grouping?: boolean;
    collapsible?: boolean;
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
    multiple = false,
    grouping = false,
    collapsible = false,
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            let contentHeight = 240;
            if (contentRef.current) {
                contentHeight = contentRef.current.offsetHeight;
            } else {
                const itemHeight = 38;
                const searchHeight = searchable ? 52 : 0;

                const optionsCount = filteredOptions.length;

                let groupsHeight = 0;
                if (grouping) {
                    const groups = new Set(filteredOptions.map(o => o.group).filter(Boolean)).size;
                    groupsHeight = groups * 30;
                }

                contentHeight = Math.min(searchHeight + (optionsCount * itemHeight) + groupsHeight, 300);
            }

            let position: 'bottom' | 'top' = 'bottom';
            let topPosition = rect.bottom + 4;

            if (spaceBelow < contentHeight + 10 && spaceAbove > contentHeight) {
                position = 'top';
                topPosition = rect.top - contentHeight - 4;
            }

            setDropdownPosition(position);
            setCoords({
                top: topPosition,
                left: rect.left,
                width: rect.width,
            });
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                const portalElement = document.getElementById(`dropdown-portal-${label || 'default'}`);
                if (portalElement && portalElement.contains(event.target as Node)) {
                    return;
                }
                handleClose();
            }
        };

        const handleResize = () => {
            if (isOpen) {
                updatePosition();
            }
        };

        const handleScroll = () => {
            if (isOpen) {
                updatePosition();
            }
        };

        if (isOpen) {
            updatePosition();
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('resize', handleResize);
            window.addEventListener('scroll', handleScroll, true);

            if (searchable) {
                setTimeout(() => {
                    searchInputRef.current?.focus();
                }, 150);
            }
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen, searchable, label]);

    const displayValue = useMemo(() => {
        if (multiple && Array.isArray(value)) {
            if (value.length === 0) return placeholder;
            if (value.length === 1) {
                return options.find(o => o.value === value[0])?.label || placeholder;
            }
            return `Обрано ${value.length}`;
        }
        const selectedOption = options.find(opt => opt.value === value);
        return selectedOption?.label || placeholder;
    }, [value, options, multiple, placeholder]);

    useEffect(() => {
        if (isOpen && grouping && collapsible) {
            const initialExpanded: Record<string, boolean> = {};
            Object.keys(groupedOptions).forEach(group => {
                initialExpanded[group] = true;
            });
            setExpandedGroups(initialExpanded);
        }
    }, [isOpen, grouping, collapsible]);

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const filteredOptions = useMemo(() => {
        return searchable && searchQuery
            ? options.filter(opt =>
                opt.label.toLowerCase().includes(searchQuery.toLowerCase())
            )
            : options;
    }, [options, searchable, searchQuery]);

    const groupedOptions = useMemo(() => {
        if (!grouping) return { 'default': filteredOptions };

        const groups: Record<string, DropdownOption[]> = {};
        filteredOptions.forEach(opt => {
            const groupName = opt.group || 'Інше';
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(opt);
        });
        return groups;
    }, [filteredOptions, grouping]);

    const handleSelect = (optionValue: string | number) => {
        if (multiple) {
            const currentValues = Array.isArray(value) ? value : [];
            const newValue = currentValues.includes(optionValue)
                ? currentValues.filter(v => v !== optionValue)
                : [...currentValues, optionValue];
            onChange(newValue);
        } else {
            onChange(optionValue);
            handleClose();
        }
    };

    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(() => {
            setIsOpen(false);
            setShouldRender(false);
            setSearchQuery('');
        }, 200);
    };

    const handleToggle = () => {
        if (!disabled) {
            if (isOpen) {
                handleClose();
            } else {
                setIsOpen(true);
                setShouldRender(true);
                setTimeout(() => {
                    setIsAnimating(true);
                }, 10);
            }
        }
    };

    const isSelected = (val: string | number) => {
        if (multiple && Array.isArray(value)) {
            return value.includes(val);
        }
        return value === val;
    };

    const dropdownContent = coords && shouldRender && (
        <div
            ref={contentRef}
            id={`dropdown-portal-${label || 'default'}`}
            className="fixed bg-card border-2 border-border rounded-xl z-[9999] max-h-[300px] overflow-hidden flex flex-col backdrop-blur-sm"
            style={{
                top: coords.top,
                left: coords.left,
                width: coords.width,
                opacity: isAnimating ? 1 : 0,
                transform: isAnimating
                    ? 'translateY(0) scale(1)'
                    : dropdownPosition === 'bottom'
                        ? 'translateY(-12px) scale(0.92)'
                        : 'translateY(12px) scale(0.92)',
                transformOrigin: dropdownPosition === 'bottom' ? 'top center' : 'bottom center',
                transition: 'all 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: `
                    0 20px 40px -12px rgba(0, 0, 0, 0.25),
                    0 10px 20px -8px rgba(0, 0, 0, 0.15),
                    0 0 0 1px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
                `,
                backgroundColor: 'hsl(var(--card))',
            }}
        >
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
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            <div className="overflow-y-auto scrollbar-thin">
                {Object.keys(groupedOptions).length > 0 ? (
                    Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
                        <div key={groupName} className="border-b border-border/50 last:border-0">
                            {grouping && (
                                <button
                                    type="button"
                                    onClick={() => collapsible && toggleGroup(groupName)}
                                    className={clsx(
                                        "w-full px-3 py-2 text-xs font-bold text-muted-foreground bg-muted/20 sticky top-0 backdrop-blur-sm flex items-center justify-between transition-colors",
                                        collapsible && "hover:bg-muted/40 cursor-pointer"
                                    )}
                                >
                                    <span>{groupName}</span>
                                    {collapsible && (
                                        <ChevronDown
                                            size={12}
                                            className={clsx("transition-transform duration-200", expandedGroups[groupName] && "rotate-180")}
                                        />
                                    )}
                                </button>
                            )}
                            <div className={clsx(
                                "overflow-hidden transition-all duration-300",
                                collapsible && !expandedGroups[groupName] ? "max-h-0" : "max-h-[1000px]"
                            )}>
                                {groupOptions.map((option) => {
                                    const active = isSelected(option.value);
                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => handleSelect(option.value)}
                                            className={`w-full px-3 py-2.5 text-left text-sm transition-all flex items-center gap-3 ${active
                                                ? 'bg-primary/10 text-primary font-medium'
                                                : 'text-foreground hover:bg-muted/50'
                                                }`}
                                        >
                                            {option.icon && (
                                                <div className={clsx(
                                                    "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-muted/50",
                                                    active && "bg-primary/20"
                                                )}>
                                                    {option.icon}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold truncate">{option.label}</div>
                                                {option.description && (
                                                    <div className="text-[10px] text-muted-foreground truncate leading-tight">
                                                        {option.description}
                                                    </div>
                                                )}
                                            </div>
                                            {active && <Check size={16} className="flex-shrink-0 ml-2" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                        Нічого не знайдено
                    </div>
                )}
            </div>

            {multiple && (
                <div className="p-2 border-t border-border bg-muted/10">
                    <button
                        onClick={() => { onChange([]); handleClose(); }}
                        className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Скинути вибір
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div ref={dropdownRef} className="relative">
            {label && (
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    {label}
                </label>
            )}

            <button
                ref={buttonRef}
                type="button"
                onClick={handleToggle}
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
                <span className={value && (Array.isArray(value) ? value.length > 0 : true) ? 'text-foreground truncate' : 'text-muted-foreground'}>
                    {displayValue}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {error && (
                <p className="text-xs text-destructive mt-1">{error}</p>
            )}

            {isOpen && typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
        </div>
    );
}

export default function Demo() {
    const [value1, setValue1] = useState<string | number>('');
    const [value2, setValue2] = useState<string | number>('');
    const [value3, setValue3] = useState<string | number>('');
    const [value4, setValue4] = useState<(string | number)[]>([]);

    const options = [
        { value: '1', label: 'Червоний', group: 'Кольори' },
        { value: '2', label: 'Синій', group: 'Кольори' },
        { value: '3', label: 'Зелений', group: 'Кольори' },
        { value: '4', label: 'Яблуко', group: 'Фрукти' },
        { value: '5', label: 'Апельсин', group: 'Фрукти' },
        { value: '6', label: 'Банан', group: 'Фрукти' },
        { value: '7', label: 'Стіл', group: 'Меблі' },
        { value: '8', label: 'Стілець', group: 'Меблі' },
    ];

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <h1 className="text-2xl font-bold">Тест Dropdown</h1>

                <div className="space-y-4">
                    <Dropdown
                        label="Звичайний dropdown"
                        value={value1}
                        options={options}
                        onChange={setValue1}
                    />

                    <Dropdown
                        label="З пошуком"
                        value={value2}
                        options={options}
                        onChange={setValue2}
                        searchable
                    />

                    <Dropdown
                        label="З групуванням"
                        value={value3}
                        options={options}
                        onChange={setValue3}
                        grouping
                    />

                    <Dropdown
                        label="Множинний вибір + Групування"
                        value={value4}
                        options={options}
                        onChange={setValue4}
                        multiple
                        grouping
                        searchable
                    />
                </div>

                <div style={{ height: '400px' }} />
            </div>
        </div>
    );
}