import { UnifiedModal, ModalField } from '../ui/UnifiedModal';
import type { InventoryItem, Farm } from '../../api/types';
import type { Supplier } from './types';

interface InventoryItemModalProps {
  item: InventoryItem | null;
  farms: Farm[];
  suppliers: Supplier[];
  onSave: (data: any) => void;
  onClose: () => void;
  isLoading: boolean;
}

export function InventoryItemModal({
  item,
  farms,
  suppliers,
  onSave,
  onClose,
  isLoading,
}: InventoryItemModalProps) {
  const fields: ModalField[] = [
    { name: 'name', label: 'Item Name', type: 'text', required: true },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: [
        { value: 'seeds', label: 'Seeds' },
        { value: 'fertilizers', label: 'Fertilizers' },
        { value: 'pesticides', label: 'Pesticides' },
        { value: 'equipment', label: 'Equipment' },
        { value: 'fuel', label: 'Fuel' },
        { value: 'feed', label: 'Feed' },
        { value: 'other', label: 'Other' },
      ],
    },
    { name: 'quantity', label: 'Quantity', type: 'number', step: '0.01', required: true },
    { name: 'unit', label: 'Unit (kg, L, etc.)', type: 'text', required: true },
    { name: 'min_stock_level', label: 'Min Stock Level', type: 'number', step: '0.01' },
    { name: 'location', label: 'Storage Location', type: 'text' },
    { name: 'expiry_date', label: 'Expiry Date', type: 'date' },
    {
      name: 'farm_id',
      label: 'Farm',
      type: 'select',
      required: true,
      options: farms.map(f => ({ value: f.id.toString(), label: f.name })),
    },
    {
      name: 'supplier_id',
      label: 'Supplier',
      type: 'select',
      options: suppliers.map(s => ({ value: s.id, label: s.name })),
    },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ];

  return (
    <UnifiedModal
      isOpen={true}
      onClose={onClose}
      onSubmit={onSave}
      title={item ? 'Edit Inventory Item' : 'Add Inventory Item'}
      fields={fields}
      initialData={item || {}}
      isLoading={isLoading}
    />
  );
}
