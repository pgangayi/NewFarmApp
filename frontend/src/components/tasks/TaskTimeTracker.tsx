import { Clock, PlayCircle, PauseCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ExtendedTask } from './types';

interface TaskTimeTrackerProps {
  tasks: ExtendedTask[];
  timerActive: Record<string, boolean>;
  currentTimer: { taskId: string; startTime: Date } | null;
  onStartTimer: (task: ExtendedTask) => void;
  onStopTimer: (task: ExtendedTask) => void;
  isLoading: boolean;
}

export function TaskTimeTracker({
  tasks,
  timerActive,
  currentTimer,
  onStartTimer,
  onStopTimer,
  isLoading,
}: TaskTimeTrackerProps) {
  // Calculate summary statistics
  const totalLoggedHours =
    tasks?.reduce((sum, task) => sum + (task.total_logged_hours || 0), 0) || 0;
  const activeTrackersCount = Object.values(timerActive).filter(active => active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Time Tracking</h2>
        <div className="text-sm text-gray-600">
          {currentTimer && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tracking:{' '}
              {Math.floor((new Date().getTime() - currentTimer.startTime.getTime()) / 60000)} min
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
                        <Button size="sm" onClick={() => onStartTimer(task)} disabled={isLoading}>
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onStopTimer(task)}
                          disabled={isLoading}
                        >
                          <PauseCircle className="h-4 w-4 mr-1" />
                          Stop
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              {(!tasks || tasks.filter(task => task.status === 'in_progress').length === 0) && (
                <div className="text-center py-4 text-gray-500">No active tasks</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Summary</CardTitle>
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
                <span className="text-sm font-medium">{totalLoggedHours} h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Trackers</span>
                <span className="text-sm font-medium">{activeTrackersCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
