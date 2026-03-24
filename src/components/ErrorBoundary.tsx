import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error?.message || "An unexpected error occurred.";
      let isFirestoreError = false;
      
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.error && parsed.operationType) {
          isFirestoreError = true;
          errorMessage = parsed.error;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="bg-surface border border-red-500/30 p-8 rounded-3xl max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
            <p className="text-white/70 text-sm">
              {isFirestoreError 
                ? "There was an issue communicating with the database. You might not have the correct permissions." 
                : "We encountered an unexpected error."}
            </p>
            <div className="bg-black/40 p-4 rounded-xl text-left overflow-auto max-h-48 mt-4">
              <code className="text-red-400 text-xs font-mono break-words">
                {errorMessage}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-white font-bold py-3 rounded-xl mt-6 hover:opacity-90 transition-opacity"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
