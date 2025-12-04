import { ReactNode } from 'react';
import clsx from 'clsx';

interface BadgeProps {
    children: ReactNode;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
    return (
        <span
            className={clsx(
                'inline-flex items-center font-medium rounded-full',
                {
                    // Variants
                    'bg-secondary text-secondary-foreground': variant === 'default',
                    'bg-primary/10 text-primary': variant === 'primary',
                    'bg-green-500/10 text-green-600 dark:text-green-400': variant === 'success',
                    'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400': variant === 'warning',
                    'bg-destructive/10 text-destructive': variant === 'danger',
                    'bg-blue-500/10 text-blue-600 dark:text-blue-400': variant === 'info',

                    // Sizes
                    'px-2 py-0.5 text-xs': size === 'sm',
                    'px-2.5 py-1 text-sm': size === 'md',
                }
            )}
        >
            {children}
        </span>
    );
}
