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
                className={clsx('animate-spin text-primary', {
                    'h-4 w-4': size === 'sm',
                    'h-6 w-6': size === 'md',
                    'h-8 w-8': size === 'lg',
                })}
            />
        </div>
    );
}
