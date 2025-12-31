import { useState } from 'react';
import {
  Search,
  Plus,
  Edit,
  Eye,
  PlayCircle,
  PauseCircle,
  Flag,
  CheckSquare,
  Tag,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ExtendedTask } from './types';

interface TaskListProps {
  tasks: ExtendedTask[];
  onEditTask: (task: ExtendedTask) => void;
  onViewTask: (task: ExtendedTask) => void;
  onStartTimer: (task: ExtendedTask) => void;
  onStopTimer: (task: ExtendedTask) => void;
  timerActive: Record<string, boolean>;
  isTimerLoading: boolean;
  onCreate: () => void;
}

export function TaskList({
  tasks,
  onEditTask,
  onViewTask,
  onStartTimer,
  onStopTimer,
  timerActive,
  isTimerLoading,
  onCreate,
}: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

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

  return (
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
                        <span className="text-sm text-gray-500">👤 {task.assigned_to_name}</span>
                      )}
                      {task.task_category && (
                        <span className="text-sm text-gray-500">🏷️ {task.task_category}</span>
                      )}
                      {task.total_logged_hours && task.total_logged_hours > 0 && (
                        <span className="text-sm text-gray-500">⏱️ {task.total_logged_hours}h</span>
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
                    <Button size="sm" variant="outline" onClick={() => onEditTask(task)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onViewTask(task)}>
                      <Eye className="h-3 w-3" />
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
              {task.tags && (
                <div className="flex items-center gap-2 mt-3 pl-9">
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
            <Button onClick={onCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Task
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
