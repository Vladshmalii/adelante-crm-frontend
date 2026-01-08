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
                        'absolute z-[110] px-3 py-2 text-xs font-medium text-white bg-neutral-900/90 backdrop-blur-md rounded-xl whitespace-normal min-w-[200px] max-w-[280px] shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200 pointer-events-none',
                        {
                            'bottom-full left-1/2 -translate-x-1/2 mb-3': position === 'top',
                            'top-full left-1/2 -translate-x-1/2 mt-3': position === 'bottom',
                            'right-full top-0 mr-3': position === 'left',
                            'left-full top-0 ml-3': position === 'right',
                        }
                    )}
                >
                    {content}
                    {/* Arrow */}
                    <div
                        className={clsx(
                            'absolute w-2 h-2 bg-neutral-900/90 border-white/10 border rotate-45',
                            {
                                'bottom-[-5px] left-1/2 -translate-x-1/2 border-t-0 border-l-0': position === 'top',
                                'top-[-5px] left-1/2 -translate-x-1/2 border-b-0 border-r-0': position === 'bottom',
                                'right-[-5px] top-3 border-b-0 border-l-0': position === 'left',
                                'left-[-5px] top-3 border-t-0 border-r-0': position === 'right',
                            }
                        )}
                    />
                </div>
            )}
        </div>
    );
}
