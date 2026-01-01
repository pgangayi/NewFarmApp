import type { InventoryItem } from '../../api/types';
import { Card, CardContent } from '../ui/card';
import { BarChart3 } from 'lucide-react';

export function InventoryAnalytics({ inventoryItems }: { inventoryItems: InventoryItem[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 text-center">
          <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium">Inventory Analytics</h3>
          <p className="text-gray-500">Stock consumption and forecast reports coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
