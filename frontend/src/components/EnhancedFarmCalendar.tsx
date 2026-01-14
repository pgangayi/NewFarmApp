import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  // Filter,
  Bell,
  // Clock,
  // MapPin,
  // Users,
  Sprout,
  Activity,
  AlertTriangle,
  Sun,
  Cloud,
  CloudRain,
  // Zap,
  Target,
  Brain,
  // Lightbulb,
  // Download,
  // Share,
  Edit,
  Trash2,
  // CheckCircle,
  // X,
  // Settings,
  TrendingUp,
  CalendarDays,
  // Timer,
  Bot,
  // TrendingDown,
  // User,
  // Briefcase,
  // Home,
  // Plane,
  BookOpen,
  Wrench,
  Users,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Select } from './ui/select';
import { Switch } from './ui/switch';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  endTime?: string;
  type:
    | 'task'
    | 'crop'
    | 'animal'
    | 'weather'
    | 'irrigation'
    | 'harvest'
    | 'veterinary'
    | 'breeding'
    | 'maintenance'
    | 'training'
    | 'meeting'
    | 'planning';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  description?: string;
  location?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  relatedId?: string;
  icon?: React.ComponentType<any>;
  color?: string;
  // Enhanced properties
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  participants?: string[];
  resources?: string[];
  estimatedDuration?: number;
  actualDuration?: number;
  aiRecommended?: boolean;
  conflictRisk?: 'low' | 'medium' | 'high';
}

interface EventTemplate {
  id: string;
  name: string;
  description: string;
  category: 'crop' | 'animal' | 'maintenance' | 'administrative' | 'training';
  defaultDuration: number;
  defaultPriority: string;
  autoSchedule: boolean;
  requiredResources: string[];
  aiOptimization: boolean;
}

interface WeatherAlert {
  id: string;
  type: 'rain' | 'frost' | 'heat' | 'wind' | 'drought';
  severity: 'low' | 'medium' | 'high' | 'critical';
  startTime: string;
  endTime: string;
  description: string;
  affectedAreas: string[];
  recommendations: string[];
}

export default function EnhancedFarmCalendar({
  farmId: _farmId = '',
  onEventClick: _onEventClick,
  onCreateEvent,
}: {
  farmId?: string;
  onEventClick?: (event: CalendarEvent) => void;
  onCreateEvent?: (date: string) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day' | 'timeline'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [showAIInsights, setShowAIInsights] = useState(false);
  // const [smartSuggestions, setSmartSuggestions] = useState(true);
  // const [conflictDetection, setConflictDetection] = useState(true);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Enhanced event data with AI recommendations
  const [events, setEvents] = useState<CalendarEvent[]>([
    // Existing events
    {
      id: 'task-1',
      title: 'Irrigate Field 1-A',
      date: '2024-11-07',
      time: '06:00',
      endTime: '08:00',
      type: 'irrigation',
      priority: 'high',
      description: 'Morning irrigation for wheat crop',
      location: 'Field 1-A',
      status: 'pending',
      isRecurring: true,
      recurringPattern: 'daily',
      resources: ['Irrigation System', 'Water', 'Operator'],
      estimatedDuration: 120,
      aiRecommended: false,
      conflictRisk: 'low',
    },
    {
      id: 'task-2',
      title: 'Animal Health Check',
      date: '2024-11-07',
      time: '09:00',
      endTime: '11:00',
      type: 'veterinary',
      priority: 'urgent',
      description: 'Monthly health assessment for cattle',
      location: 'Barn A',
      status: 'pending',
      participants: ['Dr. Smith', 'Farm Manager'],
      resources: ['Medical Kit', 'Cattle Chute'],
      estimatedDuration: 120,
      aiRecommended: true,
      conflictRisk: 'medium',
    },
    {
      id: 'task-3',
      title: 'Plan Spring Rotation',
      date: '2024-11-08',
      time: '14:00',
      endTime: '16:00',
      type: 'planning',
      priority: 'normal',
      description: 'Strategic planning for spring crop rotation',
      location: 'Office',
      status: 'pending',
      participants: ['Farm Manager', 'Agronomist'],
      resources: ['Planning Documents', 'Computer', 'Whiteboard'],
      estimatedDuration: 120,
      aiRecommended: true,
      conflictRisk: 'low',
    },
    {
      id: 'task-4',
      title: 'Equipment Maintenance',
      date: '2024-11-09',
      time: '08:00',
      endTime: '12:00',
      type: 'maintenance',
      priority: 'high',
      description: 'Routine maintenance for tractor #2',
      location: 'Equipment Shed',
      status: 'pending',
      participants: ['Mechanic', 'Tractor Operator'],
      resources: ['Tools', 'Spare Parts', 'Oil'],
      estimatedDuration: 240,
      aiRecommended: false,
      conflictRisk: 'high',
    },
  ]);

  const [eventTemplates] = useState<EventTemplate[]>([
    {
      id: 'irrigation-template',
      name: 'Irrigation Session',
      description: 'Automated irrigation scheduling for crops',
      category: 'crop',
      defaultDuration: 120,
      defaultPriority: 'normal',
      autoSchedule: true,
      requiredResources: ['Irrigation System', 'Water Supply'],
      aiOptimization: true,
    },
    {
      id: 'health-check-template',
      name: 'Animal Health Assessment',
      description: 'Regular health check for livestock',
      category: 'animal',
      defaultDuration: 90,
      defaultPriority: 'high',
      autoSchedule: false,
      requiredResources: ['Veterinarian', 'Medical Kit'],
      aiOptimization: true,
    },
    {
      id: 'harvest-template',
      name: 'Crop Harvest',
      description: 'Harvest operations for mature crops',
      category: 'crop',
      defaultDuration: 480,
      defaultPriority: 'urgent',
      autoSchedule: true,
      requiredResources: ['Harvest Equipment', 'Labor', 'Transport'],
      aiOptimization: true,
    },
  ]);

  const [weatherAlerts] = useState<WeatherAlert[]>([
    {
      id: 'rain-alert-1',
      type: 'rain',
      severity: 'medium',
      startTime: '2024-11-08T00:00:00Z',
      endTime: '2024-11-08T18:00:00Z',
      description: 'Moderate rainfall expected - adjust irrigation schedule',
      affectedAreas: ['Field 1-A', 'Field 2-B'],
      recommendations: [
        'Cancel morning irrigation for affected fields',
        'Monitor soil drainage',
        'Prepare drainage systems',
      ],
    },
    {
      id: 'frost-alert-1',
      type: 'frost',
      severity: 'high',
      startTime: '2024-11-09T02:00:00Z',
      endTime: '2024-11-09T07:00:00Z',
      description: 'Frost warning for tonight - protect sensitive crops',
      affectedAreas: ['Field 3-C', 'Greenhouse'],
      recommendations: [
        'Cover sensitive crops with frost protection',
        'Move potted plants indoors',
        'Monitor temperature closely',
      ],
    },
  ]);

  // AI-powered smart suggestions
  const aiSuggestions = useMemo(() => {
    const suggestions = [];

    // Weather-based suggestions
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0] as string;

    const weatherEvents = weatherAlerts.filter(
      alert => alert.startTime && alert.startTime.startsWith(tomorrowDate)
    );

    if (weatherEvents.length > 0) {
      suggestions.push({
        type: 'weather',
        title: "Weather Alert: Adjust Tomorrow's Schedule",
        description: `${weatherEvents.length} weather alerts detected for tomorrow. Consider rescheduling outdoor activities.`,
        action: 'reschedule',
        priority: 'high',
      });
    }

    // Resource optimization suggestions
    const todayEvents = events.filter(
      event => event.date === new Date().toISOString().split('T')[0]
    );
    const highConflictEvents = todayEvents.filter(event => event.conflictRisk === 'high');

    if (highConflictEvents.length > 0) {
      suggestions.push({
        type: 'conflict',
        title: 'Schedule Conflicts Detected',
        description: `${highConflictEvents.length} events have high conflict risk. Review resource allocation.`,
        action: 'review',
        priority: 'urgent',
      });
    }

    // Seasonal planning suggestions
    const currentMonth = new Date().getMonth();
    if (currentMonth === 10) {
      // November
      suggestions.push({
        type: 'planning',
        title: 'Spring Planning Season',
        description: 'Consider starting spring crop rotation planning for next season.',
        action: 'plan',
        priority: 'medium',
      });
    }

    return suggestions;
  }, [events, weatherAlerts]);

  // Event filtering and conflict detection
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (eventFilter === 'all') return true;
      if (eventFilter === 'ai-recommended') return event.aiRecommended;
      if (eventFilter === 'conflicts')
        return event.conflictRisk === 'high' || event.conflictRisk === 'medium';
      return event.type === eventFilter;
    });
  }, [events, eventFilter]);

  // Generate timeline view events
  const timelineEvents = useMemo(() => {
    if (view !== 'timeline') return [];

    const allEvents = filteredEvents;
    const timeline = [];

    // Group events by week
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(currentDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekEvents = allEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= weekStart && eventDate <= weekEnd;
      });

      timeline.push({
        weekStart,
        weekEnd,
        events: weekEvents,
      });
    }

    return timeline;
  }, [filteredEvents, currentDate, view]);

  const createEventFromTemplate = (template: EventTemplate, date: string) => {
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: template.name,
      date: date,
      type: (template.category as any) || 'task',
      priority: (template.defaultPriority as any) || 'normal',
      description: template.description,
      status: 'pending',
      estimatedDuration: template.defaultDuration,
      aiRecommended: template.aiOptimization,
      resources: template.requiredResources,
      isRecurring: template.autoSchedule,
      recurringPattern: template.autoSchedule ? 'weekly' : undefined,
    };

    setEvents(prev => [...prev, newEvent]);
    setIsCreatingEvent(false);
  };

  const resolveConflict = (eventId: string) => {
    setEvents(prev =>
      prev.map(event => (event.id === eventId ? { ...event, conflictRisk: 'low' as const } : event))
    );
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      task: CalendarIcon,
      crop: Sprout,
      animal: Activity,
      irrigation: Activity,
      harvest: Target,
      veterinary: AlertTriangle,
      maintenance: Wrench,
      training: BookOpen,
      meeting: Users,
      planning: Brain,
      weather: Cloud,
    };
    return icons[type] || CalendarIcon;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-100';
      case 'high':
        return 'text-orange-700 bg-orange-100';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100';
      case 'low':
        return 'text-blue-700 bg-blue-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getConflictColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-white';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Enhanced Calendar Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">Enhanced Farm Calendar</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-0">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* AI Insights Toggle */}
            <div className="flex items-center space-x-2">
              <Switch checked={showAIInsights} onCheckedChange={setShowAIInsights} />
              <span className="text-sm text-gray-600">AI Insights</span>
              <Bot className="h-4 w-4 text-purple-500" />
            </div>

            {/* Enhanced View Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'month', label: 'Month', icon: CalendarIcon },
                { key: 'week', label: 'Week', icon: CalendarDays },
                { key: 'day', label: 'Day', icon: CalendarIcon },
                { key: 'timeline', label: 'Timeline', icon: TrendingUp },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setView(key as 'month' | 'week' | 'day' | 'timeline')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                    view === key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Enhanced Event Filter */}
            <select
              value={eventFilter}
              onChange={e => setEventFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Events</option>
              <option value="ai-recommended">AI Recommended</option>
              <option value="conflicts">Schedule Conflicts</option>
              <option value="task">Tasks</option>
              <option value="crop">Crop Activities</option>
              <option value="animal">Animal Care</option>
              <option value="irrigation">Irrigation</option>
              <option value="harvest">Harvest</option>
              <option value="veterinary">Veterinary</option>
              <option value="maintenance">Maintenance</option>
              <option value="meeting">Meetings</option>
            </select>

            {/* Smart Event Creation */}
            <Dialog open={isCreatingEvent} onOpenChange={setIsCreatingEvent}>
              <DialogTrigger asChild>
                <button className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-3 py-2 rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Smart Add</span>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Smart Event</DialogTitle>
                  <DialogDescription>
                    Choose a template or let AI suggest the best scheduling
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Event Templates</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {eventTemplates.map(template => (
                        <button
                          key={template.id}
                          onClick={() =>
                            createEventFromTemplate(
                              template,
                              currentDate.toISOString().split('T')[0] || ''
                            )
                          }
                          className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-gray-600">{template.description}</div>
                          {template.aiOptimization && (
                            <Badge className="mt-1 text-xs">
                              <Bot className="h-3 w-3 mr-1" />
                              AI Optimized
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">AI Recommendations</h4>
                    <div className="space-y-2">
                      {aiSuggestions.slice(0, 3).map((suggestion, index) => (
                        <div key={index} className="p-2 bg-purple-50 rounded-lg">
                          <div className="font-medium text-sm">{suggestion.title}</div>
                          <div className="text-xs text-gray-600">{suggestion.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* AI Insights Panel */}
      {showAIInsights && (
        <div className="border-b border-gray-100 p-4 bg-purple-50">
          <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI-Powered Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiSuggestions.map((suggestion, index) => (
              <div key={index} className="bg-white p-3 rounded-lg border border-purple-200">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-purple-900">{suggestion.title}</div>
                    <div className="text-xs text-purple-700 mt-1">{suggestion.description}</div>
                    <Button size="sm" className="mt-2" variant="outline">
                      {suggestion.action === 'reschedule'
                        ? 'Reschedule'
                        : suggestion.action === 'review'
                          ? 'Review'
                          : 'Plan'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weather Alerts */}
      <div className="border-b border-gray-100 p-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Cloud className="h-4 w-4" />
          Weather Alerts
        </h4>
        <div className="flex flex-wrap gap-2">
          {weatherAlerts.map(alert => (
            <div
              key={alert.id}
              className={`px-3 py-1 rounded-full text-sm ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-center gap-1">
                {alert.type === 'rain' && <CloudRain className="h-3 w-3" />}
                {alert.type === 'frost' && <Cloud className="h-3 w-3" />}
                {alert.type === 'heat' && <Sun className="h-3 w-3" />}
                {alert.severity} {alert.type} alert
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline View */}
      {view === 'timeline' && (
        <div className="p-6">
          <div className="space-y-6">
            {timelineEvents.map((week, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h4 className="font-medium">
                    Week of {week.weekStart.toLocaleDateString()} -{' '}
                    {week.weekEnd.toLocaleDateString()}
                  </h4>
                </div>
                <div className="p-4">
                  {week.events.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No events this week</p>
                  ) : (
                    <div className="space-y-3">
                      {week.events.map(event => {
                        const IconComponent = getTypeIcon(event.type);
                        return (
                          <div
                            key={event.id}
                            className={`p-3 border-l-4 rounded-r-lg ${getConflictColor(event.conflictRisk!)}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <IconComponent className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{event.title}</div>
                                  <div className="text-sm text-gray-600">
                                    {event.date} at {event.time}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {event.aiRecommended && (
                                  <Badge className="text-xs">
                                    <Bot className="h-3 w-3 mr-1" />
                                    AI
                                  </Badge>
                                )}
                                {event.conflictRisk !== 'low' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => resolveConflict(event.id)}
                                  >
                                    Resolve Conflict
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month View (Enhanced) */}
      {view === 'month' && (
        <div className="p-4 sm:p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();
              const isSelected = selectedDate?.toDateString() === day.toDateString();

              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-24 p-1 border border-gray-100 rounded-lg cursor-pointer transition-colors relative ${
                    isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                  } ${isToday ? 'ring-2 ring-green-500' : ''} ${isSelected ? 'bg-green-50' : ''}`}
                >
                  <div
                    className={`text-sm font-medium mb-1 ${
                      isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    } ${isToday ? 'text-green-600' : ''}`}
                  >
                    {day.getDate()}
                  </div>

                  {/* Event Indicators */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event, eventIndex) => {
                      const IconComponent = getTypeIcon(event.type);
                      return (
                        <div
                          key={eventIndex}
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          className={`text-xs p-1 rounded truncate flex items-center space-x-1 ${
                            event.priority === 'urgent'
                              ? 'bg-red-100 text-red-700'
                              : event.priority === 'high'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          <IconComponent className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{event.title}</span>
                          {event.conflictRisk === 'high' && (
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 pl-1">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Events Enhanced Panel */}
      {selectedDate && (
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">
              Events for {selectedDate.toLocaleDateString()}
            </h4>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => onCreateEvent && onCreateEvent(selectedDate.toISOString())}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Event
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {getEventsForDate(selectedDate).map(event => {
              const IconComponent = getTypeIcon(event.type);
              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border-l-4 ${getConflictColor(event.conflictRisk!)}`}
                >
                  <div className={`p-2 rounded-lg ${event.color || 'blue'}-50`}>
                    <IconComponent className={`h-4 w-4 ${event.color || 'blue'}-600`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{event.title}</p>
                      {event.aiRecommended && <Bot className="h-3 w-3 text-purple-500" />}
                      {event.conflictRisk === 'high' && (
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{event.description}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500">
                        {event.time} - {event.endTime}
                      </span>
                      {event.estimatedDuration && (
                        <span className="text-xs text-gray-500">{event.estimatedDuration}min</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        event.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : event.priority === 'high'
                            ? 'bg-orange-100 text-orange-700'
                            : event.priority === 'normal'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {event.priority}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {getEventsForDate(selectedDate).length === 0 && (
              <p className="text-gray-500 text-center py-4">No events for this date</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Helper functions
  function navigateMonth(direction: 'prev' | 'next') {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  }

  function getEventsForDate(date: Date) {
    const dateStr = date.toISOString().split('T')[0] as string;
    return filteredEvents.filter(event => event.date.startsWith(dateStr));
  }

  function generateCalendarDays() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDay = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  }
}
