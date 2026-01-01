import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import type { ExtendedTask } from './types';

interface TaskOverviewProps {
  tasks: ExtendedTask[];
  onEditTask: (task: ExtendedTask) => void;
  onStartTimer: (task: ExtendedTask) => void;
  onStopTimer: (task: ExtendedTask) => void;
  timerActive: { [key: string]: boolean };
  isTimerLoading: boolean;
}

export function TaskOverview({ tasks }: TaskOverviewProps) {
  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const highPriority = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <OverviewCard title="Pending" count={pending} color="text-yellow-600" />
        <OverviewCard title="In Progress" count={inProgress} color="text-blue-600" />
        <OverviewCard title="Completed" count={completed} color="text-green-600" />
        <OverviewCard title="High Priority" count={highPriority} color="text-red-600" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.slice(0, 5).map(task => (
            <div
              key={task.id}
              className="flex justify-between items-center py-2 border-b last:border-0"
            >
              <div>
                <p className="font-medium text-sm">{task.title}</p>
                <p className="text-xs text-gray-500">
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="outline">{task.status}</Badge>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-gray-500 text-sm">No recent activity.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function OverviewCard({ title, count, color }: { title: string; count: number; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-2xl font-bold">{count}</div>
        <p className={`text-sm ${color} font-medium`}>{title}</p>
      </CardContent>
    </Card>
  );
}
