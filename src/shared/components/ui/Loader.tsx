import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface LoaderProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function Loader({ size = 'md', className }: LoaderProps) {
    return (
        <div className={clsx('flex items-center justify-center', className)}>
            <Loader2
                className={clsx(
                    'animate-spin text-primary',
                    {
                        'w-4 h-4': size === 'sm',
                        'w-6 h-6': size === 'md',
                        'w-8 h-8': size === 'lg',
                    }
                )}
            />
        </div>
    );
}
