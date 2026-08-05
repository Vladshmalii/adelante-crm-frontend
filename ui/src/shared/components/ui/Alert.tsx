import { ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

interface AlertProps {
    children: ReactNode;
    variant?: 'info' | 'success' | 'warning' | 'error';
    title?: string;
}

export function Alert({ children, variant = 'info', title }: AlertProps) {
    const icons = {
        info: Info,
        success: CheckCircle,
        warning: AlertTriangle,
        error: AlertCircle,
    };

    const Icon = icons[variant];

    return (
        <div
            className={clsx('flex animate-fade-in gap-3 rounded-lg border p-4', {
                'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20':
                    variant === 'info',
                'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20':
                    variant === 'success',
                'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20':
                    variant === 'warning',
                'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20':
                    variant === 'error',
            })}
        >
            <Icon
                className={clsx('h-5 w-5 flex-shrink-0', {
                    'text-blue-600 dark:text-blue-400': variant === 'info',
                    'text-green-600 dark:text-green-400': variant === 'success',
                    'text-yellow-600 dark:text-yellow-400': variant === 'warning',
                    'text-red-600 dark:text-red-400': variant === 'error',
                })}
            />
            <div className="flex-1">
                {title && (
                    <h4
                        className={clsx('mb-1 font-semibold', {
                            'text-blue-900 dark:text-blue-100': variant === 'info',
                            'text-green-900 dark:text-green-100': variant === 'success',
                            'text-yellow-900 dark:text-yellow-100': variant === 'warning',
                            'text-red-900 dark:text-red-100': variant === 'error',
                        })}
                    >
                        {title}
                    </h4>
                )}
                <div
                    className={clsx('text-sm', {
                        'text-blue-800 dark:text-blue-200': variant === 'info',
                        'text-green-800 dark:text-green-200': variant === 'success',
                        'text-yellow-800 dark:text-yellow-200': variant === 'warning',
                        'text-red-800 dark:text-red-200': variant === 'error',
                    })}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
