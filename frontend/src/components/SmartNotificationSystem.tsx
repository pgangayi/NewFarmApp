import { useState } from 'react';
import {
  Bell,
  // BellOff,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  TrendingUp,
  // Droplets,
  // Thermometer,
  // Users,
  // Sprout,
  // Activity,
  // DollarSign,
  Settings,
  X,
  Eye,
  // EyeOff,
  // Volume2,
  Smartphone,
  // Mail,
  // MessageSquare,
  Filter,
  Search,
  // MoreVertical,
  Target,
  // Calendar,
  Zap,
  Award,
  Trash2,
  Archive,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Switch } from './ui/switch';

interface NotificationRule {
  id: string;
  name: string;
  description: string;
  trigger_type: 'threshold' | 'schedule' | 'event' | 'weather' | 'performance';
  category: 'critical' | 'warning' | 'info' | 'opportunity';
  is_active: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  conditions: {
    metric: string;
    operator: '>' | '<' | '=' | '!=' | '>=' | '<=';
    value: number;
    timeframe: string;
  }[];
  actions: {
    type: 'push' | 'email' | 'sms' | 'in_app';
    enabled: boolean;
    template: string;
  }[];
  last_triggered?: string;
  trigger_count: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  category: 'critical' | 'warning' | 'info' | 'opportunity';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'alert' | 'reminder' | 'update' | 'achievement' | 'recommendation';
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  expires_at?: string;
  action_url?: string;
  action_text?: string;
  related_entity?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationStats {
  total_notifications: number;
  unread_count: number;
  critical_alerts: number;
  daily_average: number;
  response_time_avg: string;
  effectiveness_score: number;
}

export default function SmartNotificationSystem() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'rules' | 'settings' | 'analytics'>(
    'notifications'
  );
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'notif-1',
      title: 'Critical: Low Soil Moisture Alert',
      message:
        'Field 3-B wheat crop showing soil moisture below critical threshold (18%). Immediate irrigation recommended.',
      category: 'critical',
      priority: 'urgent',
      type: 'alert',
      is_read: false,
      is_archived: false,
      created_at: '2024-11-07T10:30:00Z',
      action_url: '/fields/3-b',
      action_text: 'View Field',
      related_entity: 'field-3b',
      metadata: { field_id: '3b', moisture_level: 18, threshold: 25 },
    },
    {
      id: 'notif-2',
      title: 'Weather Alert: Frost Warning',
      message: 'Temperature drop expected tonight. Protect sensitive crops and animals.',
      category: 'warning',
      priority: 'high',
      type: 'alert',
      is_read: false,
      is_archived: false,
      created_at: '2024-11-07T09:15:00Z',
      action_url: '/weather',
      action_text: 'View Weather',
      metadata: { low_temp: 2, expected_time: '23:00' },
    },
    {
      id: 'notif-3',
      title: 'Task Reminder: Harvest Planning',
      message: 'Corn harvest for Field 1-A scheduled for tomorrow. Preparation checklist ready.',
      category: 'info',
      priority: 'medium',
      type: 'reminder',
      is_read: true,
      is_archived: false,
      created_at: '2024-11-07T08:00:00Z',
      action_url: '/tasks/harvest-1a',
      action_text: 'View Task',
      related_entity: 'task-harvest-1a',
    },
    {
      id: 'notif-4',
      title: 'Opportunity: Optimal Planting Conditions',
      message:
        'Perfect soil conditions detected for soybeans. Consider accelerating planting schedule.',
      category: 'opportunity',
      priority: 'medium',
      type: 'recommendation',
      is_read: false,
      is_archived: false,
      created_at: '2024-11-07T07:45:00Z',
      action_url: '/crops/planting',
      action_text: 'Plan Planting',
      metadata: { soil_temp: 18, moisture: 65, ph: 6.8 },
    },
    {
      id: 'notif-5',
      title: 'Achievement: 90% Task Completion Rate',
      message: 'Congratulations! Your farm achieved a 90% task completion rate this week.',
      category: 'info',
      priority: 'low',
      type: 'achievement',
      is_read: true,
      is_archived: false,
      created_at: '2024-11-06T18:00:00Z',
      action_url: '/analytics',
      action_text: 'View Analytics',
    },
  ]);

  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([
    {
      id: 'rule-1',
      name: 'Critical Soil Moisture Alert',
      description: 'Alert when soil moisture drops below 25% in active crop fields',
      trigger_type: 'threshold',
      category: 'critical',
      is_active: true,
      priority: 'urgent',
      conditions: [{ metric: 'soil_moisture', operator: '<', value: 25, timeframe: '1hour' }],
      actions: [
        { type: 'push', enabled: true, template: 'critical_soil_moisture' },
        { type: 'email', enabled: true, template: 'soil_moisture_email' },
      ],
      last_triggered: '2024-11-07T10:30:00Z',
      trigger_count: 12,
    },
    {
      id: 'rule-2',
      name: 'Weather-Based Irrigation Alert',
      description: 'Smart irrigation recommendations based on weather forecast',
      trigger_type: 'weather',
      category: 'info',
      is_active: true,
      priority: 'medium',
      conditions: [
        { metric: 'rainfall_probability', operator: '<', value: 30, timeframe: '24hours' },
      ],
      actions: [{ type: 'push', enabled: true, template: 'irrigation_recommendation' }],
      last_triggered: '2024-11-07T06:00:00Z',
      trigger_count: 45,
    },
    {
      id: 'rule-3',
      name: 'Animal Health Check Reminder',
      description: 'Weekly reminder for systematic animal health assessments',
      trigger_type: 'schedule',
      category: 'info',
      is_active: true,
      priority: 'medium',
      conditions: [
        { metric: 'days_since_last_check', operator: '>', value: 7, timeframe: '1week' },
      ],
      actions: [
        { type: 'push', enabled: true, template: 'health_check_reminder' },
        { type: 'email', enabled: false, template: 'health_check_email' },
      ],
      last_triggered: '2024-11-05T09:00:00Z',
      trigger_count: 8,
    },
    {
      id: 'rule-4',
      name: 'Profitability Optimization',
      description: 'Alert when cost optimization opportunities are detected',
      trigger_type: 'performance',
      category: 'opportunity',
      is_active: true,
      priority: 'high',
      conditions: [{ metric: 'cost_per_unit', operator: '>', value: 100, timeframe: '1month' }],
      actions: [{ type: 'push', enabled: true, template: 'cost_optimization' }],
      last_triggered: '2024-11-04T14:20:00Z',
      trigger_count: 3,
    },
  ]);

  const [stats] = useState<NotificationStats>({
    total_notifications: 247,
    unread_count: 3,
    critical_alerts: 2,
    daily_average: 8.2,
    response_time_avg: '12 minutes',
    effectiveness_score: 94,
  });

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'info':
        return 'text-blue-600 bg-blue-100';
      case 'opportunity':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="h-4 w-4" />;
      case 'reminder':
        return <Clock className="h-4 w-4" />;
      case 'update':
        return <Info className="h-4 w-4" />;
      case 'achievement':
        return <Award className="h-4 w-4" />;
      case 'recommendation':
        return <Target className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'unread' && !notification.is_read) ||
      (filter === 'critical' && notification.category === 'critical') ||
      (filter === 'opportunity' && notification.category === 'opportunity');

    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, is_read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, is_read: true })));
  };

  const archiveNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, is_archived: true } : notification
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const toggleRule = (id: string) => {
    setNotificationRules(prev =>
      prev.map(rule => (rule.id === id ? { ...rule, is_active: !rule.is_active } : rule))
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Smart Notification System</h1>
                <p className="text-gray-600 mt-1">
                  AI-powered alerts and intelligent farm management notifications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <Badge className="bg-red-100 text-red-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {stats.critical_alerts} Critical
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                <Bell className="h-3 w-3 mr-1" />
                {stats.unread_count} Unread
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
              <Settings className="h-4 w-4 mr-2" />
              Configure Rules
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.total_notifications}</div>
              <p className="text-sm text-gray-600 mt-2">This month</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Daily Average</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.daily_average}</div>
              <p className="text-sm text-gray-600 mt-2">Notifications per day</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.response_time_avg}</div>
              <p className="text-sm text-gray-600 mt-2">Average response</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Effectiveness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.effectiveness_score}%</div>
              <p className="text-sm text-gray-600 mt-2">Alert effectiveness</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-sm border-b mb-8 rounded-lg shadow-sm">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { key: 'notifications', label: 'Notifications', icon: Bell },
              { key: 'rules', label: 'Smart Rules', icon: Settings },
              { key: 'settings', label: 'Settings', icon: Settings },
              { key: 'analytics', label: 'Analytics', icon: TrendingUp },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() =>
                  setActiveTab(key as 'notifications' | 'rules' | 'settings' | 'analytics')
                }
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === key
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="opportunity">Opportunities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredNotifications.map(notification => (
                <Card
                  key={notification.id}
                  className={`border-0 shadow-lg ${!notification.is_read ? 'ring-2 ring-blue-200' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">{getPriorityIcon(notification.priority)}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <h3
                              className={`text-lg font-semibold ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}
                            >
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getCategoryColor(notification.category)}>
                              {notification.category}
                            </Badge>
                            <div className="flex items-center gap-1">
                              {getTypeIcon(notification.type)}
                              <span className="text-xs text-gray-500">{notification.type}</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-4">{notification.message}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{new Date(notification.created_at).toLocaleString()}</span>
                            {notification.metadata && (
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {Object.keys(notification.metadata).length} data points
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {notification.action_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => (window.location.href = notification.action_url!)}
                              >
                                {notification.action_text || 'View'}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              disabled={notification.is_read}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Mark Read
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => archiveNotification(notification.id)}
                            >
                              <Archive className="h-3 w-3 mr-1" />
                              Archive
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Smart Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Smart Notification Rules</h2>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                <Zap className="h-4 w-4 mr-2" />
                Create New Rule
              </Button>
            </div>

            <div className="space-y-4">
              {notificationRules.map(rule => (
                <Card key={rule.id} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                          <Badge className={getCategoryColor(rule.category)}>{rule.category}</Badge>
                          <Badge variant="outline">{rule.priority}</Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{rule.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                          <div>
                            <span className="font-medium">Trigger Type:</span> {rule.trigger_type}
                          </div>
                          <div>
                            <span className="font-medium">Times Triggered:</span>{' '}
                            {rule.trigger_count}
                          </div>
                          <div>
                            <span className="font-medium">Last Triggered:</span>{' '}
                            {rule.last_triggered
                              ? new Date(rule.last_triggered).toLocaleString()
                              : 'Never'}
                          </div>
                          <div>
                            <span className="font-medium">Conditions:</span>{' '}
                            {rule.conditions.length} rules
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => toggleRule(rule.id)}
                        />
                        <span className="text-sm text-gray-600">
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-gray-700">Actions:</span>
                          <div className="flex items-center gap-2">
                            {rule.actions.map((action, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className={
                                  action.enabled
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-gray-50 text-gray-500'
                                }
                              >
                                {action.type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Settings className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-blue-500" />
                  Notification Channels
                </CardTitle>
                <CardDescription>Configure how and where you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Push Notifications</h4>
                    <p className="text-sm text-gray-600">Real-time alerts on your device</p>
                  </div>
                  <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Important alerts via email</p>
                  </div>
                  <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Sound Alerts</h4>
                    <p className="text-sm text-gray-600">Play sound for critical alerts</p>
                  </div>
                  <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-purple-500" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Customize your notification experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="block text-sm font-medium text-gray-700 mb-2">
                      Do Not Disturb Hours
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="time" defaultValue="22:00" aria-label="Start Time" />
                      <Input type="time" defaultValue="07:00" aria-label="End Time" />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="notification-frequency"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Notification Frequency
                    </label>
                    <Select value="immediate">
                      <SelectTrigger id="notification-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="hourly">Hourly Summary</SelectItem>
                        <SelectItem value="daily">Daily Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Notification Trends</CardTitle>
                  <CardDescription>Daily notification patterns and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Notification trend chart would appear here</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Response Analytics</CardTitle>
                  <CardDescription>
                    How quickly you respond to different notification types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Response time analysis chart would appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
