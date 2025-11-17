import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../hooks/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { useApiClient } from '../hooks/useApiClient';
import { useFarm } from '../hooks/useFarm';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  CheckSquare,
  Clock,
  Users,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Edit,
  Eye,
  MessageSquare,
  BarChart3,
  Timer,
  Target,
  Award,
  ChevronDown,
  ChevronRight,
  Flag,
  Tag,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

interface Task {
  id: number;
  farm_id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  priority_score?: number;
  due_date?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  created_by: string;
  created_by_name?: string;
  estimated_duration?: number;
  actual_duration?: number;
  dependencies?: string;
  resource_requirements?: string;
  task_category?: string;
  recurring_pattern?: string;
  completion_criteria?: string;
  progress_percentage: number;
  tags?: string;
  location?: string;
  farm_name?: string;
  time_log_count?: number;
  total_logged_hours?: number;
  comment_count?: number;
  on_time_completion?: boolean;
  actual_completion_days?: number;
  created_at: string;
  updated_at?: string;
  time_logs?: TimeLog[];
  comments?: TaskComment[];
}

interface TimeLog {
  id: number;
  task_id: number;
  user_id: string;
  user_name?: string;
  start_time?: string;
  end_time?: string;
  break_time?: number;
  total_hours?: number;
  work_notes?: string;
  productivity_rating?: number;
  interruptions_count?: number;
  created_at: string;
}

interface TaskComment {
  id: number;
  task_id: number;
  user_id: string;
  user_name?: string;
  comment_text: string;
  comment_type: 'general' | 'update' | 'issue' | 'completion';
  created_at: string;
}

interface TaskTemplate {
  id: number;
  farm_id: number;
  template_name: string;
  category: string;
  description?: string;
  estimated_duration?: number;
  required_resources?: string;
  priority_level?: number;
  dependencies?: string;
  instructions?: string;
  farm_name?: string;
  created_by_name?: string;
  created_at: string;
}

interface TaskFormData {
  farm_id: number;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  assigned_to?: string;
  priority_score?: number;
  estimated_duration?: number;
  dependencies?: string;
  resource_requirements?: string;
  task_category?: string;
  completion_criteria?: string;
  progress_percentage?: number;
  tags?: string;
  location?: string;
}

export function TasksPage() {
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<
    'overview' | 'tasks' | 'templates' | 'analytics' | 'time-tracker'
  >('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [timerActive, setTimerActive] = useState<{ [key: number]: boolean }>({});
  const [currentTimer, setCurrentTimer] = useState<{
    taskId: number;
    startTime: Date;
  } | null>(null);

  const { tasks, isLoading, error, refetch, createTask, updateTask, deleteTask } = useTasks();
  const apiClient = useApiClient();
  const { currentFarm } = useFarm();
  const [activeLogMap, setActiveLogMap] = useState<Record<number, number | null>>({});

  // We'll use useTasks' create/update/delete which already invalidate ['tasks']

  const startTimer = async (task: Task) => {
    const now = new Date().toISOString();
    try {
      const res = await apiClient.post('/api/tasks/time-logs', {
        task_id: task.id,
        start_time: now,
      });
      // expect res.id or res.data.id
      const id = (res && (res.id || (res.data && res.data.id))) as number | undefined;
      setActiveLogMap(prev => ({ ...prev, [task.id]: id || null }));
      setTimerActive(prev => ({ ...prev, [task.id]: true }));
      setCurrentTimer({ taskId: task.id, startTime: new Date() });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (err) {
      console.error('Failed to start timer', err);
    }
  };

  const stopTimer = async (task: Task) => {
    const now = new Date().toISOString();
    const logId = activeLogMap[task.id];
    try {
      if (logId) {
        await apiClient.patch(`/api/tasks/time-logs/${logId}`, { end_time: now });
      } else {
        // fallback: send end by task id
        await apiClient.post('/api/tasks/time-logs', { task_id: task.id, end_time: now });
      }
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setTimerActive(prev => ({ ...prev, [task.id]: false }));
      setCurrentTimer(null);
      setActiveLogMap(prev => ({ ...prev, [task.id]: null }));
    } catch (err) {
      console.error('Failed to stop timer', err);
    }
  };

  const handleCreateTask = (taskData: TaskFormData) => {
    createTaskMutation.mutate(taskData);
  };

  const handleUpdateTask = (taskData: TaskFormData) => {
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, ...taskData });
    }
  };

  const handleStartTimer = (task: Task) => {
    const now = new Date().toISOString();
    startTimerMutation.mutate({ taskId: task.id, startTime: now });
    setCurrentTimer({ taskId: task.id, startTime: new Date() });
    setTimerActive(prev => ({ ...prev, [task.id]: true }));
  };

  const handleStopTimer = (task: Task) => {
    const now = new Date().toISOString();
    stopTimerMutation.mutate({ taskId: task.id, endTime: now });
  };

  if (!isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to view tasks.</p>
        </div>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading tasks...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error loading tasks</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );

  // Calculate summary statistics
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(task => task.status === 'completed').length || 0;
  const inProgressTasks = tasks?.filter(task => task.status === 'in_progress').length || 0;
  const pendingTasks = tasks?.filter(task => task.status === 'pending').length || 0;
  const overdueTasks =
    tasks?.filter(
      task => task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
    ).length || 0;

  // Filter tasks based on search and filters
  const filteredTasks =
    tasks?.filter(task => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = !selectedStatus || task.status === selectedStatus;
      const matchesPriority = !selectedPriority || task.priority === selectedPriority;
      const matchesCategory = !selectedCategory || task.task_category === selectedCategory;
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    }) || [];

  // Get unique categories for filter dropdown
  const categories = [...new Set(tasks?.map(task => task.task_category).filter(Boolean) || [])];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs className="mb-0" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
            <p className="text-gray-600 mt-1">Plan, track, and optimize your farm operations</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setViewMode('analytics')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: CheckSquare },
              { key: 'tasks', label: 'Tasks', icon: Target },
              { key: 'templates', label: 'Templates', icon: Target },
              { key: 'time-tracker', label: 'Time Tracker', icon: Timer },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as unknown)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  viewMode === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {key === 'tasks' && overdueTasks > 0 && (
                  <Badge className="bg-red-100 text-red-800">{overdueTasks}</Badge>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {viewMode === 'overview' && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTasks}</div>
                  <p className="text-xs text-muted-foreground">Across all farms</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <Award className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                    completion rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <PlayCircle className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
                  <p className="text-xs text-muted-foreground">Active tasks</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <PauseCircle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{pendingTasks}</div>
                  <p className="text-xs text-muted-foreground">Awaiting start</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{overdueTasks}</div>
                  <p className="text-xs text-muted-foreground">Need attention</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>Latest task activities and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks?.slice(0, 5).map(task => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            task.status === 'completed'
                              ? 'bg-green-500'
                              : task.status === 'in_progress'
                                ? 'bg-blue-500'
                                : task.status === 'pending'
                                  ? 'bg-yellow-500'
                                  : 'bg-gray-500'
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-gray-600">
                            {task.farm_name} • {task.assigned_to_name || 'Unassigned'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            task.priority === 'urgent'
                              ? 'destructive'
                              : task.priority === 'high'
                                ? 'secondary'
                                : 'default'
                          }
                        >
                          {task.priority}
                        </Badge>
                        {task.due_date && (
                          <span className="text-xs text-gray-500">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Productivity Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Task Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">This Week</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Time Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Logged Hours</span>
                      <span className="text-sm font-medium">
                        {tasks?.reduce((sum, task) => sum + (task.total_logged_hours || 0), 0) || 0}
                        h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg per Task</span>
                      <span className="text-sm font-medium">
                        {totalTasks > 0
                          ? Math.round(
                              ((tasks?.reduce(
                                (sum, task) => sum + (task.total_logged_hours || 0),
                                0
                              ) || 0) /
                                totalTasks) *
                                10
                            ) / 10
                          : 0}
                        h
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {viewMode === 'tasks' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={selectedPriority}
                onChange={e => setSelectedPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Tasks List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="divide-y divide-gray-200">
                {filteredTasks.map(task => (
                  <div key={task.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            task.status === 'completed'
                              ? 'bg-green-500'
                              : task.status === 'in_progress'
                                ? 'bg-blue-500'
                                : task.status === 'pending'
                                  ? 'bg-yellow-500'
                                  : 'bg-gray-500'
                          }`}
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-gray-500">📍 {task.farm_name}</span>
                            {task.assigned_to_name && (
                              <span className="text-sm text-gray-500">
                                👤 {task.assigned_to_name}
                              </span>
                            )}
                            {task.task_category && (
                              <span className="text-sm text-gray-500">🏷️ {task.task_category}</span>
                            )}
                            {task.total_logged_hours && task.total_logged_hours > 0 && (
                              <span className="text-sm text-gray-500">
                                ⏱️ {task.total_logged_hours}h
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            task.priority === 'urgent'
                              ? 'destructive'
                              : task.priority === 'high'
                                ? 'secondary'
                                : 'default'
                          }
                        >
                          <Flag className="h-3 w-3 mr-1" />
                          {task.priority}
                        </Badge>
                        <Badge
                          variant={
                            task.status === 'completed'
                              ? 'default'
                              : task.status === 'in_progress'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-500">{task.progress_percentage}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${task.progress_percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        {task.due_date && (
                          <span
                            className={`text-sm ${
                              new Date(task.due_date) < new Date() && task.status !== 'completed'
                                ? 'text-red-600'
                                : 'text-gray-500'
                            }`}
                          >
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" onClick={() => setEditingTask(task)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setSelectedTask(task)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          {!timerActive[task.id] ? (
                            <Button
                              size="sm"
                              onClick={() => handleStartTimer(task)}
                              disabled={startTimerMutation.isPending}
                            >
                              <PlayCircle className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStopTimer(task)}
                              disabled={stopTimerMutation.isPending}
                            >
                              <PauseCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    {task.tags && (
                      <div className="flex items-center gap-2 mt-3">
                        <Tag className="h-4 w-4 text-gray-400" />
                        {task.tags.split(',').map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                  <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h4>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || selectedStatus || selectedPriority || selectedCategory
                      ? 'Try adjusting your search or filter criteria'
                      : 'Start by creating your first task'}
                  </p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Task
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {viewMode === 'templates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Task Templates</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates?.map(template => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{template.template_name}</CardTitle>
                    <CardDescription>Category: {template.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {template.description && (
                      <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                    )}
                    <div className="space-y-2">
                      {template.estimated_duration && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Duration:</span>
                          <span className="text-sm font-medium">
                            {template.estimated_duration}h
                          </span>
                        </div>
                      )}
                      {template.priority_level && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Priority:</span>
                          <span className="text-sm font-medium">{template.priority_level}/10</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant="default">{template.category}</Badge>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          Use Template
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!templates || templates.length === 0) && (
                <div className="col-span-full text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No templates</h4>
                  <p className="text-gray-600 mb-4">
                    Create reusable task templates for common activities
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Template
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Time Tracker Tab */}
        {viewMode === 'time-tracker' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Time Tracking</h2>
              <div className="text-sm text-gray-600">
                {currentTimer && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Tracking:{' '}
                    {Math.floor(
                      (new Date().getTime() - currentTimer.startTime.getTime()) / 60000
                    )}{' '}
                    min
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Active Tasks</CardTitle>
                  <CardDescription>Tasks currently being worked on</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tasks
                      ?.filter(task => task.status === 'in_progress')
                      .map(task => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium">{task.title}</h4>
                            <p className="text-sm text-gray-600">{task.farm_name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!timerActive[task.id] ? (
                              <Button size="sm" onClick={() => handleStartTimer(task)}>
                                <PlayCircle className="h-4 w-4 mr-1" />
                                Start
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleStopTimer(task)}
                              >
                                <PauseCircle className="h-4 w-4 mr-1" />
                                Stop
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    {(!tasks ||
                      tasks.filter(task => task.status === 'in_progress').length === 0) && (
                      <div className="text-center py-4 text-gray-500">No active tasks</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Today&apos;s Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tasks Completed</span>
                      <span className="text-sm font-medium">
                        {tasks?.filter(
                          task =>
                            task.status === 'completed' &&
                            new Date(task.updated_at || task.created_at).toDateString() ===
                              new Date().toDateString()
                        ).length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Time Logged</span>
                      <span className="text-sm font-medium">
                        {tasks?.reduce((sum, task) => sum + (task.total_logged_hours || 0), 0) || 0}
                        h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Trackers</span>
                      <span className="text-sm font-medium">
                        {Object.values(timerActive).filter(active => active).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {viewMode === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Task Analytics</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Task Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completed</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{completedTasks}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">In Progress</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{inProgressTasks}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pending</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-600 h-2 rounded-full"
                            style={{
                              width: `${totalTasks > 0 ? (pendingTasks / totalTasks) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{pendingTasks}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Task Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categories.slice(0, 5).map(category => {
                      const categoryTasks =
                        tasks?.filter(task => task.task_category === category) || [];
                      return (
                        <div key={category} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{category}</span>
                          <span className="text-sm font-medium">{categoryTasks.length} tasks</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Create/Edit Task Modal */}
        {(showCreateForm || editingTask) && (
          <TaskModal
            task={editingTask}
            farms={farms || []}
            users={users || []}
            onSave={editingTask ? handleUpdateTask : handleCreateTask}
            onClose={() => {
              setShowCreateForm(false);
              setEditingTask(null);
            }}
            isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

interface TaskModalProps {
  task?: Task | null;
  farms: unknown[];
  users: unknown[];
  onSave: (data: TaskFormData) => void;
  onClose: () => void;
  isLoading: boolean;
}

function TaskModal({ task, farms, users, onSave, onClose, isLoading }: TaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    farm_id: task?.farm_id || farms[0]?.id || 1,
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'pending',
    priority: task?.priority || 'medium',
    due_date: task?.due_date || '',
    assigned_to: task?.assigned_to || '',
    priority_score: task?.priority_score || undefined,
    estimated_duration: task?.estimated_duration || undefined,
    dependencies: task?.dependencies || '',
    resource_requirements: task?.resource_requirements || '',
    task_category: task?.task_category || '',
    completion_criteria: task?.completion_criteria || '',
    progress_percentage: task?.progress_percentage || 0,
    tags: task?.tags || '',
    location: task?.location || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">{task ? 'Edit Task' : 'Create New Task'}</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm *</label>
                <select
                  value={formData.farm_id}
                  onChange={e => setFormData({ ...formData, farm_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {farms.map(farm => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <select
                  value={formData.assigned_to}
                  onChange={e => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.task_category}
                  onChange={e => setFormData({ ...formData, task_category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  <option value="Livestock">Livestock</option>
                  <option value="Crop Management">Crop Management</option>
                  <option value="Field Management">Field Management</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Administration">Administration</option>
                  <option value="Inventory">Inventory</option>
                  <option value="Finance">Finance</option>
                  <option value="Equipment">Equipment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.estimated_duration}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      estimated_duration: parseFloat(e.target.value) || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress_percentage}
                  onChange={e =>
                    setFormData({ ...formData, progress_percentage: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority Score (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority_score}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      priority_score: parseInt(e.target.value) || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the task requirements..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dependencies</label>
              <textarea
                value={formData.dependencies}
                onChange={e => setFormData({ ...formData, dependencies: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Task dependencies (comma-separated IDs or descriptions)..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resource Requirements
              </label>
              <textarea
                value={formData.resource_requirements}
                onChange={e => setFormData({ ...formData, resource_requirements: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Equipment, tools, materials needed..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Completion Criteria
              </label>
              <textarea
                value={formData.completion_criteria}
                onChange={e => setFormData({ ...formData, completion_criteria: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What constitutes task completion..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Comma-separated tags..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Specific location or area..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                {isLoading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TasksPage;
