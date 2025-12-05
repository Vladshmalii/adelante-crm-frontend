import { ReactNode, ReactElement, Children, cloneElement, isValidElement } from 'react';
import clsx from 'clsx';

interface ButtonGroupProps {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    orientation?: 'horizontal' | 'vertical';
    className?: string;
}

export function ButtonGroup({
    children,
    variant = 'secondary',
    size = 'md',
    orientation = 'horizontal',
    className,
}: ButtonGroupProps) {
    return (
        <div
            className={clsx(
                'inline-flex rounded-lg shadow-sm',
                orientation === 'vertical' ? 'flex-col' : 'flex-row',
                className
            )}
            role="group"
        >
            {Children.map(children, (child, index) => {
                if (!isValidElement(child)) return null;

                const isFirst = index === 0;
                const isLast = index === Children.count(children) - 1;
                const vertical = orientation === 'vertical';

                return cloneElement(child as ReactElement<any>, {
                    variant: child.props.variant || variant,
                    size,
                    className: clsx(
                        child.props.className,
                        'rounded-none',
                        {
                            'rounded-l-lg': isFirst && !vertical,
                            'rounded-r-lg': isLast && !vertical,
                            'rounded-t-lg': isFirst && vertical,
                            'rounded-b-lg': isLast && vertical,
                        },
                        {
                            'border-r-0': !isLast && !vertical,
                            'border-b-0': !isLast && vertical,
                        },
                        'focus:z-10'
                    ),
                });
            })}
        </div>
    );
}
