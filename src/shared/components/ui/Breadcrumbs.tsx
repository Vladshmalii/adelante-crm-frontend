import { Fragment, ReactNode } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

export interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: ReactNode;
}

interface BreadcrumbsProps {
    items?: BreadcrumbItem[];
    separator?: ReactNode;
    showHome?: boolean;
    className?: string;
}

const routeLabels: Record<string, string> = {
    calendar: 'Календар',
    clients: 'Клієнти',
    staff: 'Персонал',
    services: 'Послуги',
    finances: 'Фінанси',
    inventory: 'Склад',
    overview: 'Огляд',
    settings: 'Налаштування',
};

export function Breadcrumbs({
    items,
    separator = <ChevronRight className="h-4 w-4" />,
    showHome = true,
    className,
}: BreadcrumbsProps) {
    const pathname = usePathname();

    const generateBreadcrumbs = (): BreadcrumbItem[] => {
        if (items) return items;

        const paths = pathname.split('/').filter(Boolean);
        const breadcrumbs: BreadcrumbItem[] = [];

        paths.forEach((path, index) => {
            const href = '/' + paths.slice(0, index + 1).join('/');
            const label = routeLabels[path] || path.charAt(0).toUpperCase() + path.slice(1);

            breadcrumbs.push({
                label,
                href,
            });
        });

        return breadcrumbs;
    };

    const breadcrumbItems = generateBreadcrumbs();

    return (
        <nav aria-label="Breadcrumb" className={clsx('flex items-center gap-2', className)}>
            {showHome && (
                <>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                        <Home className="h-4 w-4" />
                        <span>Головна</span>
                    </Link>
                    {breadcrumbItems.length > 0 && (
                        <span className="text-muted-foreground">{separator}</span>
                    )}
                </>
            )}

            {breadcrumbItems.map((item, index) => {
                const isLast = index === breadcrumbItems.length - 1;

                return (
                    <Fragment key={index}>
                        {item.href && !isLast ? (
                            <Link
                                href={item.href}
                                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                                {item.icon}
                                <span>{item.label}</span>
                            </span>
                        )}

                        {!isLast && (
                            <span className="text-muted-foreground">{separator}</span>
                        )}
                    </Fragment>
                );
            })}
        </nav>
    );
}
