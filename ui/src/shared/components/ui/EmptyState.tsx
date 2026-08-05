import { ReactNode } from 'react';
import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                {icon || <FileQuestion className="h-8 w-8 text-muted-foreground" />}
            </div>
            <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">{title}</h3>
            {description && (
                <p className="mb-6 max-w-md text-sm text-muted-foreground">{description}</p>
            )}
            {action && <div>{action}</div>}
        </div>
    );
}
