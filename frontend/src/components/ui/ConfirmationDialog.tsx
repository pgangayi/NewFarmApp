import React, { useState, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialogs = {
  delete: (itemName: string): ConfirmOptions => ({
    title: 'Confirm Deletion',
    message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    confirmText: 'Delete',
    variant: 'danger',
  }),
  archive: (itemName: string): ConfirmOptions => ({
    title: 'Confirm Archive',
    message: `Are you sure you want to archive "${itemName}"? It will be hidden from the main list.`,
    confirmText: 'Archive',
    variant: 'warning',
  }),
  save: (): ConfirmOptions => ({
    title: 'Confirm Changes',
    message: 'Do you want to save your changes?',
    confirmText: 'Save',
    variant: 'info',
  }),
};

export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    message: '',
  });
  const [resolver, setResolver] = useState<(value: boolean) => void>(() => {});

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    setOptions(options);
    setIsOpen(true);
    return new Promise(resolve => {
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    resolver(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolver(false);
  };

  const ConfirmationDialog = (
    <Dialog open={isOpen} onOpenChange={open => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {options.variant === 'danger' && <AlertTriangle className="h-6 w-6 text-red-600" />}
            {options.variant === 'warning' && <AlertTriangle className="h-6 w-6 text-yellow-600" />}
            <DialogTitle>{options.title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">{options.message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {options.cancelText || 'Cancel'}
          </Button>
          <Button
            variant={options.variant === 'danger' ? 'destructive' : 'default'}
            onClick={handleConfirm}
          >
            {options.confirmText || 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return {
    confirm,
    ConfirmationDialog,
  };
}
