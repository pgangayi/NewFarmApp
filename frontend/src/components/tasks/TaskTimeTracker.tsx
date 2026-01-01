import type { ExtendedTask } from './types';
import { Button } from '../ui/button';
import { Play, Square } from 'lucide-react';
import { UnifiedList } from '../ui/UnifiedList';

interface TaskTimeTrackerProps {
  tasks: ExtendedTask[];
  timerActive: { [key: string]: boolean };
  currentTimer: { taskId: string; startTime: Date } | null;
  onStartTimer: (task: ExtendedTask) => void;
  onStopTimer: (task: ExtendedTask) => void;
  isLoading: boolean;
}

export function TaskTimeTracker({
  tasks,
  timerActive,
  onStartTimer,
  onStopTimer,
  isLoading,
}: TaskTimeTrackerProps) {
  const activeTask = tasks.find(t => timerActive[t.id]);

  return (
    <div className="space-y-6">
      {activeTask && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">Active Timer</h3>
            <p className="text-blue-700">{activeTask.title}</p>
          </div>
          <Button
            variant="destructive"
            onClick={() => onStopTimer(activeTask)}
            disabled={isLoading}
          >
            <Square className="h-4 w-4 mr-2" /> Stop
          </Button>
        </div>
      )}

      <UnifiedList
        title="Available Tasks"
        items={tasks.filter(t => t.status !== 'completed')}
        columns={[
          { key: 'title', label: 'Task' },
          { key: 'priority', label: 'Priority' },
        ]}
        actions={[
          {
            key: 'toggle-timer',
            label: 'Toggle Timer',
            icon: Play,
            onClick: item => {
              const task = item as unknown as ExtendedTask;
              if (timerActive[task.id]) onStopTimer(task);
              else onStartTimer(task);
            },
            color: 'green',
          },
        ]}
      />
    </div>
  );
}
