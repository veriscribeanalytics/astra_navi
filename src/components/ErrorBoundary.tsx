'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4 opacity-30">✦</div>
            <h2 className="text-2xl font-headline font-bold text-primary mb-3">
              System Error Detected
            </h2>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              The cosmic energies have shifted unexpectedly. Please refresh the page to realign your connection.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-secondary text-on-primary rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
