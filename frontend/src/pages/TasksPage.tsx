import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Target, Timer, BarChart3, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useAuth } from '../hooks/AuthContext';
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useStartTimeLog,
  useStopTimeLog,
  useFarmWithSelection,
  apiClient,
} from '../api';
import type { Farm, User, Task } from '../api/types';

import { ExtendedTask, TaskFormData, TaskTemplate } from '../components/tasks/types';
import { TaskOverview } from '../components/tasks/TaskOverview';
import { TaskList } from '../components/tasks/TaskList';
import { TaskTemplates } from '../components/tasks/TaskTemplates';
import { TaskAnalytics } from '../components/tasks/TaskAnalytics';
import { TaskTimeTracker } from '../components/tasks/TaskTimeTracker';
import { TaskModal } from '../components/tasks/TaskModal';

export function TasksPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<
    'overview' | 'tasks' | 'templates' | 'analytics' | 'time-tracker'
  >('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<ExtendedTask | null>(null);
  const [timerActive, setTimerActive] = useState<{ [key: string]: boolean }>({});
  const [currentTimer, setCurrentTimer] = useState<{
    taskId: string;
    startTime: Date;
  } | null>(null);
  const [isTimerLoading, setIsTimerLoading] = useState(false);
  const [activeLogMap, setActiveLogMap] = useState<Record<string, number | null>>({});

  const { currentFarm } = useFarmWithSelection();
  const {
    data: rawTasks = [],
    isLoading,
    error,
  } = useTasks(currentFarm?.id ? { farm_id: currentFarm.id } : undefined);
  const tasks = rawTasks as ExtendedTask[];

  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const startTimerMutation = useStartTimeLog();
  const stopTimerMutation = useStopTimeLog();

  const createTask = (data: any) => createMutation.mutate(data);
  const updateTask = (data: any) => updateMutation.mutate({ id: data.id, ...data });

  const isCreating = createMutation.isPending;
  const isUpdating = updateMutation.isPending;

  // Placeholder for users list - ideally fetched from API
  const users: User[] = [];
  // Placeholder for templates - ideally fetched from API
  const templates: TaskTemplate[] = [];

  const startTimer = async (task: ExtendedTask) => {
    setIsTimerLoading(true);
    const now = new Date().toISOString();
    try {
      const res = await startTimerMutation.mutateAsync({
        taskId: task.id,
        startTime: now,
      });
      // expect res.id or res.data.id
      const id = res.id;
      setActiveLogMap(prev => ({ ...prev, [task.id]: id || null }));
      setTimerActive(prev => ({ ...prev, [task.id]: true }));
      setCurrentTimer({ taskId: task.id, startTime: new Date() });
    } catch (err) {
      console.error('Failed to start timer', err);
    } finally {
      setIsTimerLoading(false);
    }
  };

  const stopTimer = async (task: ExtendedTask) => {
    setIsTimerLoading(true);
    const now = new Date().toISOString();
    const logId = activeLogMap[task.id];
    try {
      if (logId) {
        await stopTimerMutation.mutateAsync({
          logId,
          endTime: now,
        });
      } else {
        // fallback: send end by task id if logId is missing (though hook expects logId)
        // If logId is missing, we can't use the hook as is.
        // We might need to fetch active log first or just use the fallback endpoint if it supports it.
        // For now, we'll assume logId is present or we can't stop it properly via ID.
        // But wait, the original code had a fallback:
        // await apiClient.post('/api/tasks/time-logs', { task_id: task.id, end_time: now });
        // I should probably support that in the hook or just use apiClient here for the fallback.
        await apiClient.post('/api/tasks/time-logs', { task_id: task.id, end_time: now });
      }
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setTimerActive(prev => ({ ...prev, [task.id]: false }));
      setCurrentTimer(null);
      setActiveLogMap(prev => ({ ...prev, [task.id]: null }));
    } catch (err) {
      console.error('Failed to stop timer', err);
    } finally {
      setIsTimerLoading(false);
    }
  };

  const handleCreateTask = (taskData: TaskFormData) => {
    createTask(taskData as any);
  };

  const handleUpdateTask = (taskData: TaskFormData) => {
    if (editingTask) {
      updateTask({
        id: editingTask.id,
        ...taskData,
      } as any);
    }
  };

  const handleStartTimer = (task: ExtendedTask) => {
    startTimer(task);
  };

  const handleStopTimer = (task: ExtendedTask) => {
    stopTimer(task);
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

  const overdueTasks =
    tasks?.filter(
      task => task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
    ).length || 0;

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
                onClick={() =>
                  setViewMode(
                    key as 'overview' | 'tasks' | 'templates' | 'analytics' | 'time-tracker'
                  )
                }
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
          <TaskOverview
            tasks={tasks}
            onEditTask={setEditingTask}
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
            timerActive={timerActive}
            isTimerLoading={isTimerLoading}
          />
        )}

        {/* Tasks Tab */}
        {viewMode === 'tasks' && (
          <TaskList
            tasks={tasks}
            onEditTask={setEditingTask}
            onViewTask={(task: ExtendedTask) => console.log('View task', task)}
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
            timerActive={timerActive}
            isTimerLoading={isTimerLoading}
            onCreate={() => setShowCreateForm(true)}
          />
        )}

        {/* Templates Tab */}
        {viewMode === 'templates' && (
          <TaskTemplates
            templates={templates}
            onCreateTemplate={() => console.log('Create template')}
          />
        )}

        {/* Time Tracker Tab */}
        {viewMode === 'time-tracker' && (
          <TaskTimeTracker
            tasks={tasks}
            timerActive={timerActive}
            currentTimer={currentTimer}
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
            isLoading={isTimerLoading}
          />
        )}

        {/* Analytics Tab */}
        {viewMode === 'analytics' && <TaskAnalytics tasks={tasks} />}

        {/* Create/Edit Task Modal */}
        {(showCreateForm || editingTask) && (
          <TaskModal
            task={editingTask}
            farms={currentFarm ? [currentFarm as unknown as Farm] : []}
            users={users}
            onSave={editingTask ? handleUpdateTask : handleCreateTask}
            onClose={() => {
              setShowCreateForm(false);
              setEditingTask(null);
            }}
            isLoading={isCreating || isUpdating}
          />
        )}
      </div>
    </div>
  );
}

export default TasksPage;
