import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import {
  Bell,
  CheckCircle,
  X,
  AlertTriangle,
  Info,
  Settings,
  Loader2,
  AlertCircle,
  BellRing,
} from 'lucide-react';

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
  onNotificationClick,
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

  const {
    data: notifications,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['weather-notifications', farmId],
    queryFn: async () => {
      const response = await fetch('/api/weather/recommendations', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');

      const recommendations = await response.json();

      // Convert recommendations to notifications
      const notifications: WeatherNotification[] = recommendations.map((rec: unknown) => ({
        id: rec.id,
        type: rec.priority === 'urgent' || rec.priority === 'high' ? 'alert' : 'recommendation',
        title: rec.title,
        message: rec.description,
        severity: rec.priority,
        timestamp: rec.created_at,
        acknowledged: false,
        actions: rec.action_items,
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
          alert_id: notificationId,
        }),
      });

      if (!response.ok) throw new Error('Failed to acknowledge notification');
      return response.json();
    },
    onSuccess: () => {
      refetch();
    },
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
      const criticalAlerts = notifications.filter(
        n =>
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
            tag: alert.id,
          });
        }
      });
    }
  }, [notifications, enablePush, permissionStatus]);

  const unacknowledgedNotifications = notifications?.filter(n => !n.acknowledged) || [];
  const displayedNotifications = showAll
    ? notifications || []
    : unacknowledgedNotifications.slice(0, 5);

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
      case 'critical':
        return 'border-red-500 bg-gradient-to-r from-red-50 to-pink-50';
      case 'high':
        return 'border-orange-500 bg-gradient-to-r from-orange-50 to-yellow-50';
      case 'medium':
        return 'border-yellow-500 bg-gradient-to-r from-yellow-50 to-amber-50';
      default:
        return 'border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading notifications...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Notifications Unavailable</h2>
          <p className="text-gray-600 mb-4">
            We&apos;re having trouble loading weather notifications. Please check your connection
            and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-sm border border-white/20 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <BellRing className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Weather Notifications</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Stay informed about weather alerts and recommendations
                  </p>
                </div>
              </div>
            </div>

            {/* Notification Permission Button */}
            {enablePush && permissionStatus === 'default' && (
              <button
                onClick={requestNotificationPermission}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Enable Push Notifications
              </button>
            )}
          </div>
        </div>

        {/* Notifications Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {displayedNotifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">No pending weather notifications at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`border rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg ${getSeverityColor(notification.severity)}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1 p-2 bg-white rounded-lg shadow-sm">
                      {getNotificationIcon(notification.type, notification.severity)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2 ml-3">
                          {notification.severity && (
                            <span
                              className={`text-xs px-2 py-1 rounded-full text-white font-medium ${
                                notification.severity === 'critical'
                                  ? 'bg-red-600'
                                  : notification.severity === 'high'
                                    ? 'bg-orange-500'
                                    : notification.severity === 'medium'
                                      ? 'bg-yellow-500'
                                      : 'bg-gray-500'
                              }`}
                            >
                              {notification.severity.toUpperCase()}
                            </span>
                          )}

                          {!notification.acknowledged && (
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-3">{notification.message}</p>

                      {notification.actions && notification.actions.length > 0 && (
                        <div className="text-xs text-gray-600 mb-3">
                          <span className="font-semibold">Recommended Actions: </span>
                          {notification.actions.slice(0, 2).join(', ')}
                          {notification.actions.length > 2 && '...'}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleString()}
                        </div>

                        {notification.acknowledged && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Acknowledged</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {notifications && notifications.length > 5 && !showAll && (
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full text-center text-blue-600 hover:text-blue-800 py-3 text-sm font-medium transition-colors"
                >
                  View all {notifications.length} notifications
                </button>
              )}

              {showAll && notifications && notifications.length > 5 && (
                <button
                  onClick={() => setShowAll(false)}
                  className="w-full text-center text-gray-600 hover:text-gray-800 py-3 text-sm font-medium transition-colors"
                >
                  Show less
                </button>
              )}
            </div>
          )}

          {/* Notification Settings */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              Notification Settings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-100">
                <input type="checkbox" defaultChecked className="mr-3 text-red-500" />
                <div>
                  <span className="text-sm font-medium text-gray-900">Weather alerts</span>
                  <p className="text-xs text-gray-600">Critical & high priority alerts</p>
                </div>
              </label>
              <label className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <input type="checkbox" defaultChecked className="mr-3 text-blue-500" />
                <div>
                  <span className="text-sm font-medium text-gray-900">Farming recommendations</span>
                  <p className="text-xs text-gray-600">Weather-based farming tips</p>
                </div>
              </label>
              <label className="flex items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                <input type="checkbox" className="mr-3 text-green-500" />
                <div>
                  <span className="text-sm font-medium text-gray-900">Daily summary</span>
                  <p className="text-xs text-gray-600">Daily weather summary</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeatherNotifications;
