import type { ExtendedTask } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function TaskAnalytics({ tasks: _tasks }: { tasks: ExtendedTask[] }) {
  // Placeholder analytics
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Task Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Chart coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
