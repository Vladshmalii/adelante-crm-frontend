import { ReactNode, ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'icon';
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
        icon: 'w-5 h-5',
    }[size];

    return (
        <button
            disabled={disabled || isLoading}
            className={clsx(
                'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
                'active:scale-95',
                {
                    'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active shadow-sm hover:shadow-md disabled:bg-primary-disabled': variant === 'primary',
                    'bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-sm': variant === 'secondary',
                    'bg-transparent text-foreground hover:bg-secondary hover:text-secondary-foreground': variant === 'ghost',
                    'bg-destructive text-destructive-foreground hover:bg-destructive-hover shadow-sm': variant === 'danger',
                    'bg-transparent border border-border text-foreground hover:bg-secondary': variant === 'outline',

                    'px-3 py-1.5 text-sm gap-1.5': size === 'sm',
                    'px-4 py-2 text-base gap-2': size === 'md',
                    'px-6 py-3 text-lg gap-2.5': size === 'lg',
                    'p-2 aspect-square': size === 'icon',

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