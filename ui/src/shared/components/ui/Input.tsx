import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                        {label}
                        {props.required && <span className="ml-1 text-destructive">*</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    className={clsx(
                        'w-full rounded-lg border px-3 py-2 transition-all duration-200',
                        'bg-background text-foreground placeholder:text-muted-foreground',
                        'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        error
                            ? 'border-destructive focus:ring-destructive/20'
                            : 'border-border hover:border-primary/50',
                        className,
                    )}
                    {...props}
                />
                {error && (
                    <p className="mt-1.5 animate-fade-in text-sm text-destructive">{error}</p>
                )}
                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>
                )}
            </div>
        );
    },
);

Input.displayName = 'Input';
