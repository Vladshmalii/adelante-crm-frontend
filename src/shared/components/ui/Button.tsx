import { ReactNode, ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    isLoading?: boolean;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className,
    isLoading = false,
    ...props
}: ButtonProps) {
    const { disabled, ...restProps } = props;

    return (
        <button
            disabled={disabled || isLoading}
            className={clsx(
                'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
                'active:scale-95',
                {
                    // Variants
                    'bg-primary text-primary-foreground hover:bg-[hsl(var(--primary-hover))] active:bg-[hsl(var(--primary-active))] shadow-sm hover:shadow-md': variant === 'primary',
                    'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm': variant === 'secondary',
                    'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
                    'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm': variant === 'danger',

                    // Sizes
                    'px-3 py-1.5 text-sm': size === 'sm',
                    'px-4 py-2 text-base': size === 'md',
                    'px-6 py-3 text-lg': size === 'lg',

                    // Width
                    'w-full': fullWidth,
                },
                className
            )}
            {...restProps}
        >
            {isLoading && (
                <span
                    className="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                />
            )}
            {children}
        </button>
    );
}