import { ReactNode } from 'react';
import { Card } from './Card';

interface ChartCardProps {
    title: string;
    children: ReactNode;
    className?: string;
}

export function ChartCard({ title, children, className }: ChartCardProps) {
    return (
        <Card className={className}>
            <div className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
                {children}
            </div>
        </Card>
    );
}