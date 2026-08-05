'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-[400px] items-center justify-center p-6">
                    <div className="w-full max-w-md text-center">
                        <div className="mb-6 flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                                <AlertTriangle className="h-8 w-8 text-destructive" />
                            </div>
                        </div>

                        <h2 className="mb-2 font-heading text-xl font-bold text-foreground">
                            Помилка компонента
                        </h2>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Виникла помилка під час відображення цього компонента.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-left">
                                <p className="break-all font-mono text-xs text-destructive">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-center gap-3">
                            <button
                                onClick={this.handleReset}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Спробувати знову
                            </button>
                            <Link
                                href="/ui/public"
                                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary-hover"
                            >
                                <Home className="h-4 w-4" />
                                На головну
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: ReactNode,
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
}
