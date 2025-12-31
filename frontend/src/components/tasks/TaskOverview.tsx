import {
  CheckSquare,
  Award,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  Flag,
  Edit,
  Eye,
  Tag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ExtendedTask } from './types';

interface TaskOverviewProps {
  tasks: ExtendedTask[];
  onEditTask: (task: ExtendedTask) => void;
  onStartTimer: (task: ExtendedTask) => void;
  onStopTimer: (task: ExtendedTask) => void;
  timerActive: Record<string, boolean>;
  isTimerLoading: boolean;
}

export function TaskOverview({
  tasks,
  onEditTask,
  onStartTimer,
  onStopTimer,
  timerActive,
  isTimerLoading,
}: TaskOverviewProps) {
  // Calculate summary statistics
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(task => task.status === 'completed').length || 0;
  const inProgressTasks = tasks?.filter(task => task.status === 'in_progress').length || 0;
  const pendingTasks = tasks?.filter(task => task.status === 'pending').length || 0;
  const overdueTasks =
    tasks?.filter(
      task => task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
    ).length || 0;

  return (
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
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% completion
              rate
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
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" onClick={() => onEditTask(task)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    {!timerActive[task.id] ? (
                      <Button
                        size="sm"
                        onClick={() => onStartTimer(task)}
                        disabled={isTimerLoading}
                      >
                        <PlayCircle className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onStopTimer(task)}
                        disabled={isTimerLoading}
                      >
                        <PauseCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
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
                      style={{
                        width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
                      }}
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
                  {tasks?.reduce((sum, task) => sum + (task.total_logged_hours || 0), 0) || 0}h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg per Task</span>
                <span className="text-sm font-medium">
                  {totalTasks > 0
                    ? Math.round(
                        ((tasks?.reduce((sum, task) => sum + (task.total_logged_hours || 0), 0) ||
                          0) /
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
  );
}
