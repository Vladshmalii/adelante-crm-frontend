'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/shared/hooks/useTheme';
import clsx from 'clsx';

interface ThemeToggleProps {
    className?: string;
    variant?: 'icon' | 'buttons' | 'dropdown';
}

export function ThemeToggle({ className, variant = 'icon' }: ThemeToggleProps) {
    const { theme, setTheme, isDark } = useTheme();

    if (variant === 'icon') {
        return (
            <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className={clsx(
                    'p-2 rounded-lg transition-colors',
                    'hover:bg-accent/50 text-muted-foreground hover:text-foreground',
                    className
                )}
                aria-label={isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
            >
                {isDark ? (
                    <Sun className="w-5 h-5" />
                ) : (
                    <Moon className="w-5 h-5" />
                )}
            </button>
        );
    }

    if (variant === 'buttons') {
        const options: { value: 'light' | 'dark' | 'system'; icon: React.ReactNode; label: string }[] = [
            { value: 'light', icon: <Sun className="w-4 h-4" />, label: 'Світла' },
            { value: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Темна' },
            { value: 'system', icon: <Monitor className="w-4 h-4" />, label: 'Система' },
        ];

        return (
            <div className={clsx('flex gap-1 p-1 bg-muted rounded-lg', className)}>
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={clsx(
                            'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                            theme === option.value
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {option.icon}
                        <span className="hidden sm:inline">{option.label}</span>
                    </button>
                ))}
            </div>
        );
    }

    return null;
}
