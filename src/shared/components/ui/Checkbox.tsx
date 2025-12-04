import { InputHTMLAttributes, forwardRef } from 'react';
import { Check, Minus } from 'lucide-react';
import clsx from 'clsx';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, indeterminate = false, className, disabled, ...props }, ref) => {
        return (
            <label
                className={clsx(
                    'inline-flex items-center gap-2 cursor-pointer',
                    disabled && 'opacity-50 cursor-not-allowed',
                    className
                )}
            >
                <div className="relative">
                    <input
                        ref={ref}
                        type="checkbox"
                        className="sr-only peer"
                        disabled={disabled}
                        {...props}
                    />
                    <div
                        className={clsx(
                            'h-5 w-5 rounded border-2 transition-all duration-200',
                            'flex items-center justify-center',
                            'peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2',
                            indeterminate
                                ? 'bg-primary border-primary'
                                : 'border-border peer-checked:bg-primary peer-checked:border-primary'
                        )}
                    >
                        {indeterminate ? (
                            <Minus className="h-3 w-3 text-primary-foreground" />
                        ) : (
                            <Check className="h-3 w-3 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity duration-200" />
                        )}
                    </div>
                </div>
                {label && (
                    <span className="text-sm font-medium text-foreground select-none">
                        {label}
                    </span>
                )}
            </label>
        );
    }
);

Checkbox.displayName = 'Checkbox';
