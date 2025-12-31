import { AlertTriangle, Bell, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { InventoryAlert } from './types';

interface InventoryAlertsProps {
  alerts: InventoryAlert[];
  onResolveAlert: (alert: InventoryAlert, resolved: boolean) => void;
}

export function InventoryAlerts({ alerts, onResolveAlert }: InventoryAlertsProps) {
  const unresolvedAlerts = alerts?.filter(alert => !alert.resolved).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Inventory Alerts</h2>
        <Badge variant={unresolvedAlerts > 0 ? 'destructive' : 'default'}>
          {unresolvedAlerts} Unresolved
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {alerts?.map(alert => (
          <Card
            key={alert.id}
            className={`${
              alert.resolved ? 'opacity-60' : ''
            } ${alert.severity === 'critical' ? 'border-red-200' : 'border-yellow-200'}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle
                    className={`h-5 w-5 ${
                      alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                    }`}
                  />
                  <div>
                    <h4 className="font-medium">{alert.item_name}</h4>
                    <p className="text-sm text-gray-600">
                      {alert.alert_type === 'low_stock' ? 'Low Stock Alert' : alert.alert_type}
                    </p>
                    <p className="text-xs text-gray-500">
                      Current: {alert.current_quantity} / Threshold: {alert.threshold_quantity}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {alert.severity}
                  </Badge>
                  <Badge variant={alert.resolved ? 'default' : 'outline'}>
                    {alert.resolved ? 'Resolved' : 'Active'}
                  </Badge>
                  {!alert.resolved && (
                    <Button size="sm" onClick={() => onResolveAlert(alert, true)}>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
              {alert.notes && <div className="mt-2 text-sm text-gray-600">{alert.notes}</div>}
            </CardContent>
          </Card>
        ))}

        {(!alerts || alerts.length === 0) && (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No alerts</h4>
            <p className="text-gray-600">All inventory items are within acceptable ranges</p>
          </div>
        )}
      </div>
    </div>
  );
}
