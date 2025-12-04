import { ImgHTMLAttributes } from 'react';
import clsx from 'clsx';

interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src?: string;
    alt?: string;
    fallback?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    status?: 'online' | 'offline' | 'busy' | 'away';
    className?: string;
}

export function Avatar({
    src,
    alt = '',
    fallback,
    size = 'md',
    status,
    className,
    ...props
}: AvatarProps) {
    const getInitials = (name: string): string => {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const initials = fallback ? getInitials(fallback) : alt ? getInitials(alt) : '?';

    const sizeClasses = {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
    };

    const statusColors = {
        online: 'bg-green-500',
        offline: 'bg-gray-400',
        busy: 'bg-red-500',
        away: 'bg-yellow-500',
    };

    const statusSizes = {
        sm: 'h-2 w-2',
        md: 'h-2.5 w-2.5',
        lg: 'h-3 w-3',
        xl: 'h-4 w-4',
    };

    return (
        <div className={clsx('relative inline-block', className)}>
            <div
                className={clsx(
                    'rounded-full overflow-hidden flex items-center justify-center',
                    'bg-gradient-to-br from-primary/20 to-accent/20',
                    'border-2 border-background shadow-sm',
                    sizeClasses[size]
                )}
            >
                {src ? (
                    <img
                        src={src}
                        alt={alt}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                        {...props}
                    />
                ) : (
                    <span className="font-semibold text-primary select-none">
                        {initials}
                    </span>
                )}
            </div>

            {status && (
                <span
                    className={clsx(
                        'absolute bottom-0 right-0 rounded-full border-2 border-background',
                        statusColors[status],
                        statusSizes[size]
                    )}
                />
            )}
        </div>
    );
}
