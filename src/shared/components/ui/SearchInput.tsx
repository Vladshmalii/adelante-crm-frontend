import { Search, X } from 'lucide-react';
import { InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    onClear?: () => void;
}

export function SearchInput({ value, onClear, className, ...props }: SearchInputProps) {
    return (
        <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
            <input
                type="text"
                value={value}
                className={clsx(
                    'w-full h-[46px] pl-12 pr-12 rounded-2xl border border-border/50',
                    'bg-background text-foreground font-medium placeholder:text-muted-foreground/50',
                    'focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50',
                    'transition-all duration-300 shadow-sm hover:shadow-md',
                    className
                )}
                {...props}
            />
            {value && onClear && (
                <button
                    type="button"
                    onClick={onClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-300"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
