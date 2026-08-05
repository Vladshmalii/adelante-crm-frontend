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
                'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
                'active:scale-95',
                {
                    'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow-md active:bg-primary-active disabled:bg-primary-disabled':
                        variant === 'primary',
                    'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary-hover':
                        variant === 'secondary',
                    'bg-transparent text-foreground hover:bg-secondary hover:text-secondary-foreground':
                        variant === 'ghost',
                    'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive-hover':
                        variant === 'danger',
                    'border border-border bg-transparent text-foreground hover:bg-secondary':
                        variant === 'outline',

                    'gap-1.5 px-3 py-1.5 text-sm': size === 'sm',
                    'gap-2 px-4 py-2 text-base': size === 'md',
                    'gap-2.5 px-6 py-3 text-lg': size === 'lg',
                    'aspect-square p-2': size === 'icon',

                    'w-full': fullWidth,
                },
                className,
            )}
            {...restProps}
        >
            {isLoading ? (
                <span
                    className={clsx(
                        'animate-spin rounded-full border-2 border-current border-t-transparent',
                        iconSizeClass,
                    )}
                    aria-hidden="true"
                />
            ) : leftIcon ? (
                <span className={iconSizeClass}>{leftIcon}</span>
            ) : null}
            {children}
            {!isLoading && rightIcon && <span className={iconSizeClass}>{rightIcon}</span>}
        </button>
    );
}
