import type { Task } from '../../api/types';

export interface ExtendedTask extends Task {
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  field_name?: string;
  estimated_hours?: number;
  actual_hours?: number;
  completed_at?: string;
  notes?: string;
  costs?: { description: string; amount: number; currency: string }[];
}

export interface TaskFormData {
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  assigned_to_id?: string;
  farm_id: string;
  field_id?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  costs?: { description: string; amount: number; currency: string }[];
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  default_priority: 'low' | 'medium' | 'high';
  estimated_duration_minutes: number;
}
