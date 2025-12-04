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
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                {icon || <FileQuestion className="w-8 h-8 text-muted-foreground" />}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2 font-heading">
                {title}
            </h3>
            {description && (
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                    {description}
                </p>
            )}
            {action && <div>{action}</div>}
        </div>
    );
}
