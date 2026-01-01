import { UnifiedList, ColumnConfig } from '../ui/UnifiedList';
import type { InventoryItem } from '../../api/types';
import { Edit, Trash2, Eye } from 'lucide-react';
import { Badge } from '../ui/badge';

interface InventoryListProps {
  inventoryItems: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onView: (item: InventoryItem) => void;
  onCreate: () => void;
}

export function InventoryList({ inventoryItems, onEdit, onView, onCreate }: InventoryListProps) {
  const columns: ColumnConfig[] = [
    { key: 'name', label: 'Item Name', className: 'font-medium' },
    { key: 'category', label: 'Category' },
    {
      key: 'quantity',
      label: 'Stock Level',
      render: item => {
        const i = item as unknown as InventoryItem;
        // Mock threshold logic if not present
        const isLow = i.quantity < (i.min_stock_level || 10);
        return (
          <Badge variant={isLow ? 'destructive' : 'secondary'}>
            {i.quantity} {i.unit}
          </Badge>
        );
      },
    },
    { key: 'location', label: 'Location' },
    {
      key: 'updated_at',
      label: 'Last Updated',
      render: item =>
        item.updated_at ? new Date(item.updated_at as string).toLocaleDateString() : '-',
    },
  ];

  return (
    <UnifiedList
      title="Inventory Items"
      items={inventoryItems}
      columns={columns}
      actions={[
        {
          key: 'view',
          label: 'View',
          icon: Eye,
          onClick: item => onView(item as unknown as InventoryItem),
        },
        {
          key: 'edit',
          label: 'Edit',
          icon: Edit,
          onClick: item => onEdit(item as unknown as InventoryItem),
        },
      ]}
      onAdd={onCreate}
      addButtonLabel="Add Item"
      emptyState={{
        title: 'No inventory items',
        description: 'Start tracking your farm supplies and produce.',
        actionLabel: 'Add Item',
        onAction: onCreate,
      }}
    />
  );
}
