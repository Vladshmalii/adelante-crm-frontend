import { ReactNode, ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    isLoading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className,
    isLoading = false,
    leftIcon,
    rightIcon,
    ...props
}: ButtonProps) {
    const { disabled, ...restProps } = props;

    const iconSizeClass = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    }[size];

    return (
        <button
            disabled={disabled || isLoading}
            className={clsx(
                'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
                'active:scale-95',
                {
                    'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active shadow-sm hover:shadow-md disabled:bg-primary-disabled': variant === 'primary',
                    'bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-sm': variant === 'secondary',
                    'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
                    'bg-destructive text-destructive-foreground hover:bg-destructive-hover shadow-sm': variant === 'danger',

                    'px-3 py-1.5 text-sm gap-1.5': size === 'sm',
                    'px-4 py-2 text-base gap-2': size === 'md',
                    'px-6 py-3 text-lg gap-2.5': size === 'lg',

                    'w-full': fullWidth,
                },
                className
            )}
            {...restProps}
        >
            {isLoading ? (
                <span
                    className={clsx('animate-spin rounded-full border-2 border-current border-t-transparent', iconSizeClass)}
                    aria-hidden="true"
                />
            ) : leftIcon ? (
                <span className={iconSizeClass}>{leftIcon}</span>
            ) : null}
            {children}
            {!isLoading && rightIcon && (
                <span className={iconSizeClass}>{rightIcon}</span>
            )}
        </button>
    );
}