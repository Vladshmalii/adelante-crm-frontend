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
                <div className="min-h-[400px] flex items-center justify-center p-6">
                    <div className="max-w-md w-full text-center">
                        <div className="mb-6 flex justify-center">
                            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-destructive" />
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-foreground mb-2 font-heading">
                            Помилка компонента
                        </h2>
                        <p className="text-muted-foreground mb-4 text-sm">
                            Виникла помилка під час відображення цього компонента.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg text-left">
                                <p className="text-xs font-mono text-destructive break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Спробувати знову
                            </button>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg hover:bg-secondary-hover transition-colors"
                            >
                                <Home className="w-4 h-4" />
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
    fallback?: ReactNode
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
}
