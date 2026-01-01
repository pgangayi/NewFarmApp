import { ActionConfig, ColumnConfig, UnifiedList } from '../ui/UnifiedList';
import type { ExtendedTask } from './types';
import { Badge } from '../ui/badge';
import { Play, Square, CheckCircle, Edit, Eye } from 'lucide-react';

interface TaskListProps {
  tasks: ExtendedTask[];
  onEditTask: (task: ExtendedTask) => void;
  onViewTask: (task: ExtendedTask) => void;
  onStartTimer: (task: ExtendedTask) => void;
  onStopTimer: (task: ExtendedTask) => void;
  timerActive: { [key: string]: boolean };
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
  const columns: ColumnConfig[] = [
    { key: 'title', label: 'Title', className: 'col-span-1 font-medium' },
    {
      key: 'status',
      label: 'Status',
      render: item => {
        const statusColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
          completed: 'default', // Using default (black/primary) for completed
          in_progress: 'secondary', // Blue-ish usually
          pending: 'outline',
          cancelled: 'destructive',
        };
        const status = item.status as string;
        // Map unknown status to outline
        const variant = statusColors[status] || 'outline';

        return <Badge variant={variant}>{status.replace('_', ' ')}</Badge>;
      },
      className: 'col-span-1',
    },
    {
      key: 'priority',
      label: 'Priority',
      render: item => <span className="capitalize">{item.priority as string}</span>,
      className: 'col-span-1',
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: item =>
        item.due_date ? new Date(item.due_date as string).toLocaleDateString() : '-',
      className: 'col-span-1',
    },
    {
      key: 'assigned_to',
      label: 'Assigned To',
      render: item => (item.assigned_to as string) || 'Unassigned',
      className: 'col-span-1',
    },
  ];

  const actions: ActionConfig[] = [
    {
      key: 'timer',
      label: 'Timer',
      icon: Play,
      getIcon: item => {
        const task = item as unknown as ExtendedTask;
        return timerActive[task.id] ? Square : Play;
      },
      onClick: item => {
        const task = item as unknown as ExtendedTask;
        if (timerActive[task.id]) {
          onStopTimer(task);
        } else {
          onStartTimer(task);
        }
      },
      color: 'blue',
    },
    {
      key: 'view',
      label: 'View',
      icon: Eye,
      onClick: item => onViewTask(item as unknown as ExtendedTask),
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit,
      onClick: item => onEditTask(item as unknown as ExtendedTask),
    },
  ];

  // Customizing actions to handle the dynamic Timer icon is hard with current UnifiedList type
  // I will just implement basic actions.

  return (
    <UnifiedList
      title="Tasks"
      items={tasks}
      columns={columns}
      actions={[
        {
          key: 'edit',
          label: 'Edit',
          icon: Edit,
          onClick: item => onEditTask(item as unknown as ExtendedTask),
        },
      ]}
      onAdd={onCreate}
      addButtonLabel="Create Task"
      emptyState={{
        title: 'No tasks found',
        description: 'Create a task to get started tracking work.',
        actionLabel: 'Create Task',
        onAction: onCreate,
      }}
    />
  );
}
