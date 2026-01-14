import type { Supplier } from './types';
import { UnifiedList } from '../ui/UnifiedList';
import { Phone, Mail, Edit } from 'lucide-react';

interface SupplierListProps {
  suppliers: Supplier[];
  onAddSupplier: () => void;
  onEditSupplier: (supplier: Supplier) => void;
}

export function SupplierList({ suppliers, onAddSupplier, onEditSupplier }: SupplierListProps) {
  return (
    <UnifiedList
      title="Suppliers"
      items={suppliers as any[]}
      columns={[
        { key: 'name', label: 'Company', className: 'font-medium' },
        { key: 'contact_name', label: 'Contact Person' },
        {
          key: 'email',
          label: 'Email',
          render: item => (
            <a
              href={`mailto:${item.email}`}
              className="text-blue-600 hover:underline flex items-center"
            >
              <Mail className="h-3 w-3 mr-1" /> {item.email as string}
            </a>
          ),
        },
        {
          key: 'phone',
          label: 'Phone',
          render: item => (
            <a
              href={`tel:${item.phone}`}
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              <Phone className="h-3 w-3 mr-1" /> {item.phone as string}
            </a>
          ),
        },
      ]}
      actions={[
        {
          key: 'edit',
          label: 'Edit',
          icon: Edit,
          onClick: item => onEditSupplier(item as unknown as Supplier),
        },
      ]}
      onAdd={onAddSupplier}
      addButtonLabel="Add Supplier"
      emptyState={{
        title: 'No suppliers',
        description: 'Add suppliers to manage procurement.',
        actionLabel: 'Add Supplier',
        onAction: onAddSupplier,
      }}
    />
  );
}
