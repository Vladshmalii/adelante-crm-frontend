import { ReactNode, ReactElement, Children, cloneElement, isValidElement } from 'react';
import clsx from 'clsx';

interface ButtonGroupProps {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    orientation?: 'horizontal' | 'vertical';
    className?: string;
}

// Дочірні елементи — кнопки, яким прокидаються variant/size/className;
// конкретний компонент кнопки заздалегідь невідомий, тож типізуємо мінімальний
// спільний контракт пропсів, які тут читаються й перезаписуються.
interface ClonableButtonProps {
    variant?: string;
    size?: string;
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
                className,
            )}
            role="group"
        >
            {Children.map(children, (child, index) => {
                if (!isValidElement(child)) return null;

                const isFirst = index === 0;
                const isLast = index === Children.count(children) - 1;
                const vertical = orientation === 'vertical';

                const typedChild = child as ReactElement<ClonableButtonProps>;

                return cloneElement(typedChild, {
                    variant: typedChild.props.variant || variant,
                    size,
                    className: clsx(
                        typedChild.props.className,
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
                        'focus:z-10',
                    ),
                });
            })}
        </div>
    );
}
