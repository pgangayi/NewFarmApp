import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ExtendedTask } from './types';

interface TaskAnalyticsProps {
  tasks: ExtendedTask[];
}

export function TaskAnalytics({ tasks }: TaskAnalyticsProps) {
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(task => task.status === 'completed').length || 0;
  const inProgressTasks = tasks?.filter(task => task.status === 'in_progress').length || 0;
  const pendingTasks = tasks?.filter(task => task.status === 'pending').length || 0;

  // Get unique categories
  const categories = [...new Set(tasks?.map(task => task.task_category).filter(Boolean) || [])];

  return (
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
                const categoryTasks = tasks?.filter(task => task.task_category === category) || [];
                return (
                  <div key={category as string} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{category as string}</span>
                    <span className="text-sm font-medium">{categoryTasks.length} tasks</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
