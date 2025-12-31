import { Task } from '../../api';

export interface ExtendedTask extends Task {
  priority_score?: number;
  assigned_to_name?: string;
  created_by?: string;
  created_by_name?: string;
  estimated_duration?: number;
  actual_duration?: number;
  dependencies?: string;
  resource_requirements?: string;
  task_category?: string;
  recurring_pattern?: string;
  completion_criteria?: string;
  progress_percentage?: number;
  tags?: string;
  location?: string;
  farm_name?: string;
  time_log_count?: number;
  total_logged_hours?: number;
  comment_count?: number;
  on_time_completion?: boolean;
  actual_completion_days?: number;
  time_logs?: TimeLog[];
  comments?: TaskComment[];
}

export interface TimeLog {
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

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: string;
  user_name?: string;
  comment_text: string;
  comment_type: 'general' | 'update' | 'issue' | 'completion';
  created_at: string;
}

export interface TaskTemplate {
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

export interface TaskFormData {
  farm_id: string;
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | undefined;
  priority?: 'low' | 'normal' | 'high' | 'urgent' | undefined;
  due_date?: string;
  assigned_to?: string;
  priority_score?: number | undefined;
  estimated_duration?: number | undefined;
  dependencies?: string;
  resource_requirements?: string;
  task_category?: string;
  completion_criteria?: string;
  progress_percentage?: number | undefined;
  tags?: string;
  location?: string;
}
