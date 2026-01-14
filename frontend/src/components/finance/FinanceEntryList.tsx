import { UnifiedList } from '../ui/UnifiedList';
import type { FinanceEntry } from './types';
import { Edit, Eye } from 'lucide-react';
import { Badge } from '../ui/badge';

interface FinanceEntryListProps {
  entries: FinanceEntry[];
  onEdit: (entry: FinanceEntry) => void;
  onView: (entry: FinanceEntry) => void;
  onCreate: () => void;
  onGenerateReport: () => void;
}

export function FinanceEntryList({
  entries,
  onEdit,
  onView,
  onCreate,
  onGenerateReport: _onGenerateReport,
}: FinanceEntryListProps) {
  return (
    <UnifiedList
      title="Financial Transactions"
      items={entries as any[]}
      columns={[
        {
          key: 'date',
          label: 'Date',
          render: item => new Date(item.date as string).toLocaleDateString(),
        },
        { key: 'description', label: 'Description', className: 'font-medium' },
        { key: 'category', label: 'Category' },
        {
          key: 'amount',
          label: 'Amount',
          className: 'text-right font-mono',
          render: item => {
            const entry = item as unknown as FinanceEntry;
            const isExpense = entry.type === 'expense';
            return (
              <span className={isExpense ? 'text-red-600' : 'text-green-600'}>
                {isExpense ? '-' : '+'}${entry.amount.toFixed(2)}
              </span>
            );
          },
        },
        {
          key: 'status',
          label: 'Status',
          render: item => (
            <Badge variant="outline" className="uppercase text-xs">
              {item.status as string}
            </Badge>
          ),
        },
      ]}
      actions={[
        {
          key: 'view',
          label: 'View',
          icon: Eye,
          onClick: item => onView(item as unknown as FinanceEntry),
        },
        {
          key: 'edit',
          label: 'Edit',
          icon: Edit,
          onClick: item => onEdit(item as unknown as FinanceEntry),
        },
      ]}
      onAdd={onCreate}
      addButtonLabel="Add Transacation"
      emptyState={{
        title: 'No transactions',
        description: 'Record your first income or expense.',
        actionLabel: 'Add Transaction',
        onAction: onCreate,
      }}
    />
  );
}
