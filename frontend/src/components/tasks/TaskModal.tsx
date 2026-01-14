import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import type { ExtendedTask } from './types';
import type { Farm, User } from '../../api/types';

interface TaskModalProps {
  task: ExtendedTask | null;
  farms: Farm[];
  users: User[];
  onSave: (data: any) => void;
  onClose: () => void;
  isLoading: boolean;
}

interface CostItem {
  description: string;
  amount: number;
  currency: string;
}

export function TaskModal({ task, farms, users, onSave, onClose, isLoading }: TaskModalProps) {
  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    farm_id: '',
    assigned_to_id: '',
  });

  const [costs, setCosts] = useState<CostItem[]>([]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
        farm_id: task.farm_id?.toString() || '',
        assigned_to_id: task.assigned_to || '',
      });
      if (task.costs && Array.isArray(task.costs)) {
        setCosts(
          task.costs.map((c: any) => ({
            description: c.description,
            amount: c.amount,
            currency: c.currency || 'USD',
          }))
        );
      }
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
        farm_id: farms.length > 0 ? farms[0]?.id?.toString() || '' : '',
        assigned_to_id: '',
      });
      setCosts([]);
    }
  }, [task, farms]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleAddCost = () => {
    setCosts([...costs, { description: '', amount: 0, currency: 'USD' }]);
  };

  const handleRemoveCost = (index: number) => {
    setCosts(costs.filter((_, i) => i !== index));
  };

  const handleCostChange = (index: number, field: keyof CostItem, value: any) => {
    const newCosts = [...costs];
    newCosts[index] = { ...newCosts[index], [field]: value } as CostItem;
    setCosts(newCosts);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: task?.id,
      costs: costs.filter(c => c.description && c.amount > 0),
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create Task'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => handleChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="farm_id">Farm *</Label>
              <Select value={formData.farm_id} onValueChange={val => handleChange('farm_id', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Farm" />
                </SelectTrigger>
                <SelectContent>
                  {farms.map(f => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={val => handleChange('status', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={val => handleChange('priority', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={e => handleChange('due_date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assign To</Label>
              <Select
                value={formData.assigned_to_id}
                onValueChange={val => handleChange('assigned_to_id', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Cost Components
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddCost}>
                <Plus className="h-4 w-4 mr-1" />
                Add Cost
              </Button>
            </div>

            {costs.length === 0 && (
              <p className="text-sm text-gray-500 italic">No cost components added.</p>
            )}

            <div className="space-y-3">
              {costs.map((cost, index) => (
                <div key={index} className="flex items-end gap-3 bg-gray-50 p-3 rounded-md">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={cost.description}
                      onChange={e => handleCostChange(index, 'description', e.target.value)}
                      placeholder="e.g. Fertilizer, Labor"
                    />
                  </div>
                  <div className="w-32 space-y-1">
                    <Label className="text-xs">Amount</Label>
                    <Input
                      type="number"
                      value={cost.amount}
                      onChange={e => handleCostChange(index, 'amount', parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveCost(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {costs.length > 0 && (
              <div className="mt-4 text-right font-medium">
                Total Estimated Cost: $
                {costs.reduce((sum, c) => sum + (c.amount || 0), 0).toFixed(2)}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
