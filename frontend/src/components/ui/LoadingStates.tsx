import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from './button';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'green' | 'gray' | 'white';
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  color = 'blue',
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
    '2xl': 'h-16 w-16',
  };

  const colorClasses = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    gray: 'border-gray-600',
    white: 'border-white',
  };

  return (
    <Loader2
      className={`
        animate-spin ${sizeClasses[size]} ${colorClasses[color]}
        ${className}
      `}
    />
  );
}

interface LoadingScreenProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showSpinner?: boolean;
}

export function LoadingScreen({
  message = 'Loading...',
  size = 'md',
  showSpinner = true,
}: LoadingScreenProps) {
  const containerClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
  };

  const spinnerSize = size === 'sm' ? 'md' : size === 'lg' ? 'xl' : 'lg';

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
      {showSpinner && <LoadingSpinner size={spinnerSize} className="mb-4" />}
      <p className="text-lg font-medium text-gray-700">{message}</p>
    </div>
  );
}

interface LoadingCardProps {
  children: React.ReactNode;
  className?: string;
}

export function LoadingCard({ children, className = '' }: LoadingCardProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
        <LoadingSpinner size="lg" className="text-blue-600" />
      </div>
      <div className="opacity-50">{children}</div>
    </div>
  );
}

interface ErrorStateProps {
  error: Error | string | null;
  onRetry?: () => void;
  title?: string;
  message?: string;
  className?: string;
}

export function ErrorState({
  error,
  onRetry,
  title = 'Error Loading Data',
  message,
  className = '',
}: ErrorStateProps) {
  const errorMessage = typeof error === 'string' ? error : error?.message;
  const displayMessage = message || errorMessage || 'Something went wrong. Please try again.';

  return (
    <div className={`text-center py-12 ${className}`}>
      <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{displayMessage}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, icon, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

// Combined loading/error/content component for common patterns
interface LoadingErrorContentProps {
  isLoading: boolean;
  error: Error | string | null;
  children: React.ReactNode;
  loadingMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  emptyIcon?: React.ReactNode;
}

export function LoadingErrorContent({
  isLoading,
  error,
  children,
  loadingMessage = 'Loading...',
  errorTitle = 'Error Loading Data',
  errorMessage,
  onRetry,
  empty = false,
  emptyTitle = 'No data found',
  emptyDescription,
  emptyAction,
  emptyIcon,
}: LoadingErrorContentProps) {
  if (isLoading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} title={errorTitle} message={errorMessage} />;
  }

  if (empty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        icon={emptyIcon}
      />
    );
  }

  return <>{children}</>;
}
