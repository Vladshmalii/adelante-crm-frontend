import clsx from 'clsx';

interface ProgressProps {
    value: number;
    max?: number;
    variant?: 'linear' | 'circular';
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    color?: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
    className?: string;
}

export function Progress({
    value,
    max = 100,
    variant = 'linear',
    size = 'md',
    showLabel = false,
    color = 'primary',
    className,
}: ProgressProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const colorClasses = {
        primary: 'bg-primary',
        accent: 'bg-accent',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-destructive',
    };

    if (variant === 'circular') {
        const circleSize = {
            sm: { size: 48, stroke: 4 },
            md: { size: 64, stroke: 6 },
            lg: { size: 96, stroke: 8 },
        };

        const { size: circlePixels, stroke } = circleSize[size];
        const radius = (circlePixels - stroke) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;

        return (
            <div className={clsx('relative inline-flex items-center justify-center', className)}>
                <svg
                    width={circlePixels}
                    height={circlePixels}
                    className="transform -rotate-90"
                >
                    <circle
                        cx={circlePixels / 2}
                        cy={circlePixels / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={stroke}
                        fill="none"
                        className="text-muted"
                    />
                    <circle
                        cx={circlePixels / 2}
                        cy={circlePixels / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={stroke}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className={clsx('transition-all duration-300', {
                            'text-primary': color === 'primary',
                            'text-accent': color === 'accent',
                            'text-green-500': color === 'success',
                            'text-yellow-500': color === 'warning',
                            'text-destructive': color === 'danger',
                        })}
                    />
                </svg>
                {showLabel && (
                    <span className="absolute text-sm font-semibold text-foreground">
                        {Math.round(percentage)}%
                    </span>
                )}
            </div>
        );
    }

    const heightClasses = {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4',
    };

    return (
        <div className={clsx('w-full', className)}>
            <div
                className={clsx(
                    'w-full rounded-full bg-muted overflow-hidden',
                    heightClasses[size]
                )}
            >
                <div
                    className={clsx(
                        'h-full rounded-full transition-all duration-300 ease-out',
                        colorClasses[color]
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <div className="mt-1 text-xs text-muted-foreground text-right">
                    {Math.round(percentage)}%
                </div>
            )}
        </div>
    );
}
