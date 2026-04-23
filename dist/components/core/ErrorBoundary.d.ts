import React from "react";
export interface ErrorBoundaryProps {
    /** Fallback UI to render when an error is caught */
    fallback?: React.ReactNode | ((error: Error, reset: () => void) => React.ReactNode);
    /** Called when an error is caught */
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    children: React.ReactNode;
}
interface ErrorBoundaryState {
    error: Error | null;
}
export declare class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState;
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    reset: () => void;
    render(): React.ReactNode;
}
export {};
//# sourceMappingURL=ErrorBoundary.d.ts.map