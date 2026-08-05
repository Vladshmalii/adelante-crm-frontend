import { Search, X } from 'lucide-react';
import { InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    onClear?: () => void;
}

export function SearchInput({ value, onClear, className, ...props }: SearchInputProps) {
    return (
        <div className="group relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
            <input
                type="text"
                value={value}
                className={clsx(
                    'h-[46px] w-full rounded-2xl border border-border/50 pl-12 pr-12',
                    'bg-background font-medium text-foreground placeholder:text-muted-foreground/50',
                    'focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10',
                    'shadow-sm transition-all duration-300 hover:shadow-md',
                    className,
                )}
                {...props}
            />
            {value && onClear && (
                <button
                    type="button"
                    onClick={onClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
