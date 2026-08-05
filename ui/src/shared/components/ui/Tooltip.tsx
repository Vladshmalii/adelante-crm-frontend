'use client';

import { ReactNode, useState } from 'react';
import clsx from 'clsx';

interface TooltipProps {
    children: ReactNode;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, content, position = 'top' }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-flex items-center">
            <div
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="cursor-help"
            >
                {children}
            </div>
            {isVisible && (
                <div
                    className={clsx(
                        'animate-in fade-in zoom-in-95 pointer-events-none absolute z-[110] min-w-[200px] max-w-[280px] whitespace-normal rounded-xl border border-white/10 bg-neutral-900/90 px-3 py-2 text-xs font-medium text-white shadow-2xl backdrop-blur-md duration-200',
                        {
                            'bottom-full left-1/2 mb-3 -translate-x-1/2': position === 'top',
                            'left-1/2 top-full mt-3 -translate-x-1/2': position === 'bottom',
                            'right-full top-0 mr-3': position === 'left',
                            'left-full top-0 ml-3': position === 'right',
                        },
                    )}
                >
                    {content}
                    {/* Arrow */}
                    <div
                        className={clsx(
                            'absolute h-2 w-2 rotate-45 border border-white/10 bg-neutral-900/90',
                            {
                                'bottom-[-5px] left-1/2 -translate-x-1/2 border-l-0 border-t-0':
                                    position === 'top',
                                'left-1/2 top-[-5px] -translate-x-1/2 border-b-0 border-r-0':
                                    position === 'bottom',
                                'right-[-5px] top-3 border-b-0 border-l-0': position === 'left',
                                'left-[-5px] top-3 border-r-0 border-t-0': position === 'right',
                            },
                        )}
                    />
                </div>
            )}
        </div>
    );
}
