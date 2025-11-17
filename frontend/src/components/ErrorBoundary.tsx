import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ErrorBoundaryProps, ErrorBoundaryState } from '../types/ui';
import { AppError, errorHandler } from '../utils/errorHandling';

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const appError = AppError.fromUnknownError(error);
    return { hasError: true, error: appError };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const appError = AppError.fromUnknownError(error, 'Component error caught by boundary');
    errorHandler.logError(appError, 'ErrorBoundary');

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-red-100">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
              <p className="text-gray-600 mb-6">
                We encountered an unexpected error. Please try refreshing the page or contact
                support if the problem persists.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <div className="bg-gray-100 rounded-lg p-4 mb-4 text-left">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Error Details (Development only):
                  </p>
                  <code className="text-xs text-red-600 break-all">{this.state.error.message}</code>
                  {this.state.error.code && (
                    <p className="text-xs text-gray-500 mt-1">Code: {this.state.error.code}</p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
export default ErrorBoundary;
