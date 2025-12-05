import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
    label?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
    ({ label, size = 'md', className, disabled, checked, ...props }, ref) => {
        const sizeClasses = {
            sm: {
                track: 'w-9 h-5',
                thumb: 'h-4 w-4',
            },
            md: {
                track: 'w-11 h-6',
                thumb: 'h-5 w-5',
            },
            lg: {
                track: 'w-14 h-7',
                thumb: 'h-6 w-6',
            },
        };

        const translateClasses = {
            sm: 'translate-x-4',
            md: 'translate-x-5',
            lg: 'translate-x-7',
        };

        const { track, thumb } = sizeClasses[size];

        return (
            <label
                className={clsx(
                    'inline-flex items-center gap-3 cursor-pointer',
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
                        checked={checked}
                        {...props}
                    />
                    <div
                        className={clsx(
                            'rounded-full transition-all duration-200',
                            'border-2 border-transparent',
                            checked ? 'bg-primary' : 'bg-muted',
                            'peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2',
                            track
                        )}
                    />
                    <div
                        className={clsx(
                            'absolute top-0.5 left-0.5 rounded-full transition-transform duration-200',
                            'bg-card shadow-sm',
                            checked && translateClasses[size],
                            thumb
                        )}
                    />
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

Switch.displayName = 'Switch';
