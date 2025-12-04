import { ChevronDown, Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
    const [shouldRender, setShouldRender] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            
            // Получаем реальную высоту контента если он уже отрендерен
            let contentHeight = 240; // дефолтное значение
            if (contentRef.current) {
                contentHeight = contentRef.current.offsetHeight;
            } else {
                // Оценка высоты
                const itemHeight = 38;
                const searchHeight = searchable ? 52 : 0;
                const optionsCount = filteredOptions.length || options.length;
                contentHeight = Math.min(searchHeight + (optionsCount * itemHeight), 240);
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

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = searchable && searchQuery
        ? options.filter(opt =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : options;

    const handleSelect = (optionValue: string | number) => {
        onChange(optionValue);
        handleClose();
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

    const dropdownContent = coords && shouldRender && (
        <div
            ref={contentRef}
            id={`dropdown-portal-${label || 'default'}`}
            className="fixed bg-card border-2 border-border rounded-xl z-[9999] max-h-60 overflow-hidden flex flex-col backdrop-blur-sm"
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
                {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => {
                        const isActive = option.value === value;
                        return (
                            <button
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                    isActive
                                        ? 'bg-primary text-primary-foreground font-medium hover:bg-primary/80'
                                        : 'text-foreground hover:bg-primary/10 hover:text-primary'
                                }`}
                            >
                                {option.label}
                            </button>
                        );
                    })
                ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                        Нічого не знайдено
                    </div>
                )}
            </div>
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

            {isOpen && typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
        </div>
    );
}

// Demo
export default function Demo() {
    const [value1, setValue1] = useState<string | number>('');
    const [value2, setValue2] = useState<string | number>('');
    const [value3, setValue3] = useState<string | number>('');

    const options = [
        { value: '1', label: 'Опція 1' },
        { value: '2', label: 'Опція 2' },
        { value: '3', label: 'Опція 3' },
        { value: '4', label: 'Опція 4' },
        { value: '5', label: 'Опція 5' },
        { value: '6', label: 'Опція 6' },
        { value: '7', label: 'Опція 7' },
        { value: '8', label: 'Опція 8' },
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
                </div>

                <div style={{ height: '800px' }}>
                    <p className="text-muted-foreground">Проскрольте вниз ↓</p>
                </div>

                <Dropdown
                    label="Внизу сторінки"
                    value={value3}
                    options={options}
                    onChange={setValue3}
                    searchable
                />

                <div style={{ height: '400px' }} />
            </div>
        </div>
    );
}