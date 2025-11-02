import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { Bell, CheckCircle, X, AlertTriangle, Info } from 'lucide-react';

interface WeatherNotification {
  id: string;
  type: 'alert' | 'recommendation' | 'info';
  title: string;
  message: string;
  severity?: string;
  timestamp: string;
  acknowledged: boolean;
  actions?: string[];
}

interface WeatherNotificationsProps {
  farmId: string;
  enablePush?: boolean;
  onNotificationClick?: (notificationId: string) => void;
}

export function WeatherNotifications({
  farmId,
  enablePush = false,
  onNotificationClick
}: WeatherNotificationsProps) {
  const { getAuthHeaders } = useAuth();
  const [showAll, setShowAll] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
    }
  };

  const { data: notifications, refetch } = useQuery({
    queryKey: ['weather-notifications', farmId],
    queryFn: async () => {
      const response = await fetch('/api/weather/recommendations', {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      const recommendations = await response.json();
      
      // Convert recommendations to notifications
      const notifications: WeatherNotification[] = recommendations.map((rec: any) => ({
        id: rec.id,
        type: rec.priority === 'urgent' || rec.priority === 'high' ? 'alert' : 'recommendation',
        title: rec.title,
        message: rec.description,
        severity: rec.priority,
        timestamp: rec.created_at,
        acknowledged: false,
        actions: rec.action_items
      }));
      
      return notifications;
    },
    enabled: !!farmId,
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: 'acknowledge_alert',
          alert_id: notificationId
        })
      });
      
      if (!response.ok) throw new Error('Failed to acknowledge notification');
      return response.json();
    },
    onSuccess: () => {
      refetch();
    }
  });

  const handleNotificationClick = (notification: WeatherNotification) => {
    if (!notification.acknowledged) {
      acknowledgeMutation.mutate(notification.id);
    }
    onNotificationClick?.(notification.id);
  };

  // Push notification setup
  useEffect(() => {
    if (enablePush && permissionStatus === 'granted' && notifications) {
      // Check for new critical alerts
      const criticalAlerts = notifications.filter(n => 
        n.type === 'alert' && 
        n.severity === 'critical' && 
        !n.acknowledged &&
        Date.now() - new Date(n.timestamp).getTime() < 5 * 60 * 1000 // Last 5 minutes
      );

      criticalAlerts.forEach(alert => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(alert.title, {
            body: alert.message,
            icon: '/favicon.ico',
            badge: '/badge-icon.png',
            tag: alert.id
          });
        }
      });
    }
  }, [notifications, enablePush, permissionStatus]);

  const unacknowledgedNotifications = notifications?.filter(n => !n.acknowledged) || [];
  const displayedNotifications = showAll ? (notifications || []) : unacknowledgedNotifications.slice(0, 5);

  const getNotificationIcon = (type: string, severity?: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'recommendation':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  if (!notifications) {
    return (
      <div className="border rounded-lg p-4 bg-white shadow">
        <div className="flex items-center justify-center">
          <Bell className="h-5 w-5 animate-pulse mr-2" />
          <span className="text-gray-600">Loading notifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-white shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Weather Notifications</h3>
          {unacknowledgedNotifications.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unacknowledgedNotifications.length}
            </span>
          )}
        </div>
        
        {/* Notification Permission Button */}
        {enablePush && permissionStatus === 'default' && (
          <button
            onClick={requestNotificationPermission}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Enable Push Notifications
          </button>
        )}
      </div>

      {displayedNotifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p>All caught up!</p>
          <p className="text-sm">No pending weather notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded p-3 cursor-pointer transition-all hover:shadow-md ${getSeverityColor(notification.severity)}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type, notification.severity)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                    <div className="flex items-center gap-2 ml-2">
                      {notification.severity && (
                        <span className={`text-xs px-1.5 py-0.5 rounded text-white ${
                          notification.severity === 'critical' ? 'bg-red-600' :
                          notification.severity === 'high' ? 'bg-orange-500' :
                          notification.severity === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}>
                          {notification.severity.toUpperCase()}
                        </span>
                      )}
                      
                      {!notification.acknowledged && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  
                  {notification.actions && notification.actions.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Actions: </span>
                      {notification.actions.slice(0, 2).join(', ')}
                      {notification.actions.length > 2 && '...'}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(notification.timestamp).toLocaleString()}
                  </div>
                </div>
                
                {notification.acknowledged && (
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {notifications.length > 5 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-800 py-2"
            >
              View all {notifications.length} notifications
            </button>
          )}
          
          {showAll && notifications.length > 5 && (
            <button
              onClick={() => setShowAll(false)}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-800 py-2"
            >
              Show less
            </button>
          )}
        </div>
      )}

      {/* Notification Settings */}
      <div className="mt-4 pt-4 border-t">
        <h4 className="font-medium mb-2">Notification Settings</h4>
        <div className="space-y-2 text-sm">
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-2" />
            Weather alerts (critical & high priority)
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-2" />
            Farming recommendations
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            Daily weather summary
          </label>
        </div>
      </div>
    </div>
  );
}

export default WeatherNotifications;