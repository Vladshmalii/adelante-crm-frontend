import { HTMLAttributes } from 'react';
import clsx from 'clsx';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circle' | 'rectangle';
    width?: string | number;
    height?: string | number;
}

export function Skeleton({
    variant = 'rectangle',
    width,
    height,
    className,
    style,
    ...props
}: SkeletonProps) {
    const defaultHeight = variant === 'text' ? '1rem' : variant === 'circle' ? '3rem' : '8rem';
    const defaultWidth = variant === 'circle' ? '3rem' : '100%';

    return (
        <div
            className={clsx(
                'animate-pulse-soft bg-muted',
                {
                    'rounded-full': variant === 'circle',
                    'rounded': variant === 'text',
                    'rounded-lg': variant === 'rectangle',
                },
                className
            )}
            style={{
                width: width ?? defaultWidth,
                height: height ?? defaultHeight,
                ...style,
            }}
            {...props}
        />
    );
}
