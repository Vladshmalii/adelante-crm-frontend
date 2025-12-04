import { Search, X } from 'lucide-react';
import { InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    onClear?: () => void;
}

export function SearchInput({ value, onClear, className, ...props }: SearchInputProps) {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
                type="text"
                value={value}
                className={clsx(
                    'w-full pl-10 pr-10 py-2 rounded-lg border border-border',
                    'bg-background text-foreground placeholder:text-muted-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
                    'transition-all duration-200',
                    className
                )}
                {...props}
            />
            {value && onClear && (
                <button
                    type="button"
                    onClick={onClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-accent transition-colors"
                >
                    <X className="w-4 h-4 text-muted-foreground" />
                </button>
            )}
        </div>
    );
}
