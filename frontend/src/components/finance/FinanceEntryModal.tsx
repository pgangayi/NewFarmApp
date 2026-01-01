import { UnifiedModal, ModalField } from '../ui/UnifiedModal';
import type { FinanceEntry, Farm } from '../../api/types'; // Using main api types or local types?
// Using local props for entry but Farms from API.
import type { FinanceEntry as FinanceEntryType } from './types';

interface FinanceEntryModalProps {
  entry: FinanceEntryType | null;
  farms: Farm[];
  onSave: (data: any) => void;
  onClose: () => void;
  isLoading: boolean;
}

export function FinanceEntryModal({
  entry,
  farms,
  onSave,
  onClose,
  isLoading,
}: FinanceEntryModalProps) {
  const fields: ModalField[] = [
    { name: 'date', label: 'Date', type: 'date', required: true },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      options: [
        { value: 'income', label: 'Income' },
        { value: 'expense', label: 'Expense' },
      ],
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: [
        { value: 'sales', label: 'Sales' },
        { value: 'purchases', label: 'Purchases' },
        { value: 'operations', label: 'Operations' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'salary', label: 'Salary' },
        { value: 'other', label: 'Other' },
      ],
    },
    { name: 'description', label: 'Description', type: 'text', required: true },
    { name: 'amount', label: 'Amount', type: 'number', step: '0.01', required: true },
    {
      name: 'farm_id',
      label: 'Farm',
      type: 'select',
      required: true,
      options: farms.map(f => ({ value: f.id.toString(), label: f.name })),
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
  ];

  return (
    <UnifiedModal
      isOpen={true}
      onClose={onClose}
      onSubmit={onSave}
      title={entry ? 'Edit Transaction' : 'Record Transaction'}
      fields={fields}
      initialData={entry || { date: new Date().toISOString().split('T')[0], status: 'completed' }}
      isLoading={isLoading}
    />
  );
}
