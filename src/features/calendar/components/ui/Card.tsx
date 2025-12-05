import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
    children: ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    shadow?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
    children,
    className,
    padding = 'md',
    shadow = 'sm'
}: CardProps) {
    return (
        <div
            className={clsx(
                'bg-card rounded-lg border border-border',
                {
                    'p-0': padding === 'none',
                    'p-3': padding === 'sm',
                    'p-4': padding === 'md',
                    'p-6': padding === 'lg',
                    'shadow-none': shadow === 'none',
                    'shadow-soft': shadow === 'sm',
                    'shadow-soft-lg': shadow === 'md',
                    'shadow-xl': shadow === 'lg',
                },
                className
            )}
        >
            {children}
        </div>
    );
}