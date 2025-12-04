import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import clsx from 'clsx';

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
    ({ label, className, disabled, ...props }, ref) => {
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
                        type="radio"
                        className="sr-only peer"
                        disabled={disabled}
                        {...props}
                    />
                    <div
                        className={clsx(
                            'h-5 w-5 rounded-full border-2 transition-all duration-200',
                            'flex items-center justify-center',
                            'border-border peer-checked:border-primary',
                            'peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2'
                        )}
                    >
                        <div
                            className={clsx(
                                'h-2.5 w-2.5 rounded-full bg-primary',
                                'scale-0 peer-checked:scale-100 transition-transform duration-200'
                            )}
                        />
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

Radio.displayName = 'Radio';

interface RadioGroupProps {
    children: ReactNode;
    className?: string;
    orientation?: 'horizontal' | 'vertical';
}

export function RadioGroup({
    children,
    className,
    orientation = 'vertical',
}: RadioGroupProps) {
    return (
        <div
            className={clsx(
                'flex gap-4',
                orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
                className
            )}
            role="radiogroup"
        >
            {children}
        </div>
    );
}
