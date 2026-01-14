import { useState, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  // Filter,
  // Bell,
  // Clock,
  // MapPin,
  // Users,
  Sprout,
  Activity,
  AlertTriangle,
  // Sun,
  // Cloud,
  // CloudRain,
  // Zap,
  Calendar as CalendarType,
  Target,
} from 'lucide-react';
import { useTasks, useCrops, useAnimals } from '../hooks';
import type { Task, Crop, Animal } from '../api';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type:
    | 'task'
    | 'crop'
    | 'animal'
    | 'weather'
    | 'irrigation'
    | 'harvest'
    | 'veterinary'
    | 'breeding';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  description?: string;
  location?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  relatedId?: string; // ID of related entity (crop, animal, task)
  icon?: LucideIcon;
  color?: string;
}

interface CalendarViewProps {
  farmId?: string;
  onEventClick?: (event: CalendarEvent) => void;
  onCreateEvent?: (date: string) => void;
}

export default function FarmCalendarView({
  farmId: _farmId = '',
  onEventClick,
  onCreateEvent,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventFilter, setEventFilter] = useState<string>('all');

  // Data hooks
  const { data: tasks = [] } = useTasks();
  const { data: crops = [] } = useCrops();
  const { data: animals = [] } = useAnimals();

  // Generate calendar events from all sources
  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];

    // Add tasks as events
    tasks.forEach((task: Task) => {
      calendarEvents.push({
        id: `task-${task.id}`,
        title: task.title,
        date: task.due_date,
        type: 'task',
        priority: (task.priority || 'normal') as 'low' | 'normal' | 'high' | 'urgent',
        description: task.description || '',
        status: (task.status || 'pending') as 'pending' | 'in_progress' | 'completed' | 'overdue',
        relatedId: task.id,
        icon: CalendarType,
        color: getPriorityColor(task.priority || 'normal'),
      });
    });

    // Add crop-related events
    crops.forEach((crop: Crop) => {
      if (crop.planting_date) {
        calendarEvents.push({
          id: `planting-${crop.id}`,
          title: `Plant ${crop.name}`,
          date: crop.planting_date,
          type: 'crop',
          priority: 'normal',
          description: `Planting ${crop.crop_type}`,
          status: 'pending',
          relatedId: crop.id,
          icon: Sprout,
          color: 'green',
        });
      }

      // Add harvest predictions (if available)
      if (crop.expected_harvest_date) {
        calendarEvents.push({
          id: `harvest-${crop.id}`,
          title: `Harvest ${crop.name}`,
          date: crop.expected_harvest_date,
          type: 'harvest',
          priority: 'high',
          description: `Expected harvest for ${crop.crop_type}`,
          status: 'pending',
          relatedId: crop.id,
          icon: Target,
          color: 'orange',
        });
      }

      // Add irrigation schedules
      if (crop.irrigation_schedule) {
        const irrigationDates = generateIrrigationDates(crop.irrigation_schedule);
        irrigationDates.forEach(date => {
          calendarEvents.push({
            id: `irrigation-${crop.id}-${date}`,
            title: `Irrigate ${crop.name}`,
            date: date,
            type: 'irrigation',
            priority: 'normal',
            description: `Scheduled irrigation for ${crop.crop_type}`,
            status: 'pending',
            relatedId: crop.id,
            icon: Activity,
            color: 'blue',
          });
        });
      }
    });

    // Add animal events
    animals.forEach((animal: Animal) => {
      // Veterinary check-ups
      const vetDate = generateVetScheduleDate(animal.acquisition_date);
      if (vetDate) {
        calendarEvents.push({
          id: `vet-${animal.id}`,
          title: `Vet Check-up: ${animal.identification_tag}`,
          date: vetDate,
          type: 'veterinary',
          priority: 'high',
          description: 'Regular health check-up',
          status: 'pending',
          relatedId: animal.id,
          icon: Activity,
          color: 'red',
        });
      }

      // Vaccination schedules (if available)
      if ((animal as any).vaccination_status !== 'up-to-date') {
        const nextVaccination = generateNextVaccinationDate();
        if (nextVaccination) {
          calendarEvents.push({
            id: `vaccination-${animal.id}`,
            title: `Vaccination: ${animal.identification_tag}`,
            date: nextVaccination,
            type: 'veterinary',
            priority: 'urgent',
            description: 'Vaccination due',
            status: 'pending',
            relatedId: animal.id,
            icon: AlertTriangle,
            color: 'red',
          });
        }
      }
    });

    // Add weather alerts
    const weatherEvents = generateWeatherAlerts();
    calendarEvents.push(...weatherEvents);

    return calendarEvents.filter(event => {
      if (eventFilter === 'all') return true;
      return event.type === eventFilter;
    });
  }, [tasks, crops, animals, eventFilter]);

  // Get events for specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0] as string;
    return events.filter(event => event.date.startsWith(dateStr));
  };

  // Generate calendar days for current month view
  const calendarDays = useMemo(() => {
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
  }, [currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'red';
      case 'high':
        return 'orange';
      case 'normal':
        return 'blue';
      case 'low':
        return 'gray';
      default:
        return 'blue';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'task':
        return CalendarType;
      case 'crop':
        return Sprout;
      case 'animal':
        return Activity;
      case 'irrigation':
        return Activity;
      case 'harvest':
        return Target;
      case 'veterinary':
        return AlertTriangle;
      default:
        return CalendarIcon;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Calendar Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">Farm Calendar</h3>
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
            {/* View Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['month', 'week', 'day'].map(viewType => (
                <button
                  key={viewType}
                  onClick={() => setView(viewType as 'month' | 'week' | 'day')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    view === viewType
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {viewType}
                </button>
              ))}
            </div>

            {/* Event Filter */}
            <select
              value={eventFilter}
              onChange={e => setEventFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Events</option>
              <option value="task">Tasks</option>
              <option value="crop">Crop Activities</option>
              <option value="animal">Animal Care</option>
              <option value="irrigation">Irrigation</option>
              <option value="harvest">Harvest</option>
              <option value="veterinary">Veterinary</option>
            </select>

            <button
              onClick={() => onCreateEvent && onCreateEvent(currentDate.toISOString())}
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
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
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();
              const isSelected = selectedDate?.toDateString() === day.toDateString();

              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-24 p-1 border border-gray-100 rounded-lg cursor-pointer transition-colors ${
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
                      const IconComponent = getEventTypeIcon(event.type);
                      return (
                        <div
                          key={eventIndex}
                          onClick={e => {
                            e.stopPropagation();
                            onEventClick && onEventClick(event);
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

      {/* Selected Day Events */}
      {selectedDate && (
        <div className="border-t border-gray-100 p-4">
          <h4 className="font-medium text-gray-900 mb-3">
            Events for {selectedDate.toLocaleDateString()}
          </h4>
          <div className="space-y-2">
            {getEventsForDate(selectedDate).map(event => {
              const IconComponent = getEventTypeIcon(event.type);
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick && onEventClick(event)}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${event.color || 'blue'}-50`}>
                    <IconComponent className={`h-4 w-4 ${event.color || 'blue'}-600`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600">{event.description}</p>
                  </div>
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
}

// Helper functions
function generateIrrigationDates(schedule: string): string[] {
  // TODO: Implement real irrigation schedule parsing based on 'schedule' string
  return [];
}

function generateVetScheduleDate(acquisitionDate: string): string | null {
  try {
    const date = new Date(acquisitionDate);
    date.setMonth(date.getMonth() + 3); // Vet check every 3 months
    return date.toISOString().split('T')[0] as string;
  } catch {
    return null;
  }
}

function generateNextVaccinationDate(): string | null {
  const date = new Date();
  date.setDate(date.getDate() + 30); // 30 days from now
  return date.toISOString().split('T')[0] as string;
}

function generateWeatherAlerts(): CalendarEvent[] {
  // TODO: Integrate with real weather service for alerts
  return [];
}
