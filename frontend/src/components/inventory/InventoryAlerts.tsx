import { UnifiedList } from '../ui/UnifiedList';
import type { InventoryAlert } from './types';
import { Check } from 'lucide-react';
import { Badge } from '../ui/badge';

interface InventoryAlertsProps {
  alerts: InventoryAlert[];
  onResolveAlert: (alert: InventoryAlert, resolved: boolean) => void;
}

export function InventoryAlerts({ alerts, onResolveAlert }: InventoryAlertsProps) {
  return (
    <UnifiedList
      title="Inventory Alerts"
      items={alerts as any[]}
      columns={[
        { key: 'message', label: 'Message', className: 'font-medium' },
        {
          key: 'type',
          label: 'Type',
          render: item => (
            <Badge variant="outline" className="uppercase">
              {item.type as string}
            </Badge>
          ),
        },
        {
          key: 'created_at',
          label: 'Date',
          render: item => new Date(item.created_at as string).toLocaleDateString(),
        },
        {
          key: 'resolved',
          label: 'Status',
          render: item =>
            item.resolved ? (
              <span className="text-green-600 flex items-center">
                <Check className="h-3 w-3 mr-1" /> Resolved
              </span>
            ) : (
              <span className="text-yellow-600 flex items-center">Active</span>
            ),
        },
      ]}
      actions={[
        {
          key: 'resolve',
          label: 'Resolve',
          icon: Check,
          color: 'green',
          onClick: item => onResolveAlert(item as unknown as InventoryAlert, true),
          show: item => !(item as unknown as InventoryAlert).resolved,
        },
      ]}
      emptyState={{
        title: 'No alerts',
        description: 'Inventory status is good.',
      }}
    />
  );
}
