import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from './button';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'default' | 'destructive';
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'default',
  isLoading = false,
  children,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleBackdropClick} />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            {confirmVariant === 'destructive' ? (
              <Trash2 className="h-6 w-6 text-red-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">{title}</h3>

          {/* Message */}
          <p className="text-gray-600 text-center mb-6">{message}</p>

          {/* Custom content */}
          {children && <div className="mb-6">{children}</div>}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              {cancelLabel}
            </Button>
            <Button
              variant={confirmVariant === 'destructive' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for easy confirmation dialog usage
interface ConfirmationOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'default' | 'destructive';
}

export function useConfirmation() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [options, setOptions] = React.useState<ConfirmationOptions | null>(null);
  const [promise, setPromise] = React.useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = (options: ConfirmationOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setOptions(options);
      setIsOpen(true);
      setPromise({ resolve });
    });
  };

  const handleConfirm = () => {
    promise?.resolve(true);
    setIsOpen(false);
    setOptions(null);
    setPromise(null);
  };

  const handleCancel = () => {
    promise?.resolve(false);
    setIsOpen(false);
    setOptions(null);
    setPromise(null);
  };

  const ConfirmationDialogComponent = options ? (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      title={options.title}
      message={options.message}
      confirmLabel={options.confirmLabel}
      cancelLabel={options.cancelLabel}
      confirmVariant={options.confirmVariant}
    />
  ) : null;

  return {
    confirm,
    ConfirmationDialog: ConfirmationDialogComponent,
  };
}

// Pre-built confirmation dialogs for common actions
export const ConfirmDialogs = {
  delete: (itemName: string) => ({
    title: 'Delete Item',
    message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    confirmLabel: 'Delete',
    confirmVariant: 'destructive' as const,
  }),

  remove: (itemName: string) => ({
    title: 'Remove Item',
    message: `Are you sure you want to remove "${itemName}" from the list?`,
    confirmLabel: 'Remove',
    confirmVariant: 'destructive' as const,
  }),

  clear: (itemName: string) => ({
    title: 'Clear Data',
    message: `Are you sure you want to clear all ${itemName}? This action cannot be undone.`,
    confirmLabel: 'Clear All',
    confirmVariant: 'destructive' as const,
  }),

  save: (hasUnsavedChanges: boolean) => ({
    title: 'Unsaved Changes',
    message: hasUnsavedChanges
      ? 'You have unsaved changes. Are you sure you want to leave without saving?'
      : 'Are you sure you want to proceed?',
    confirmLabel: 'Leave',
    confirmVariant: 'default' as const,
  }),
};
