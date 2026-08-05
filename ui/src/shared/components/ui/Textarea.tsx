import { TextareaHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, helperText, className, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                        {label}
                        {props.required && <span className="ml-1 text-destructive">*</span>}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={clsx(
                        'w-full rounded-lg border px-3 py-2 transition-all duration-200',
                        'bg-background text-foreground placeholder:text-muted-foreground',
                        'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'resize-none',
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

Textarea.displayName = 'Textarea';
