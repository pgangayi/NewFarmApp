import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: {
    type: 'event' | 'schedule' | 'condition' | 'threshold';
    config: Record<string, any>;
  };
  conditions: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
    value: any;
    logicalOperator?: 'and' | 'or';
  }>;
  actions: Array<{
    type: 'create_task' | 'send_notification' | 'update_record' | 'send_email' | 'trigger_webhook';
    config: Record<string, any>;
  }>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  executionCount: number;
  lastExecuted?: Date;
  nextExecution?: Date;
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  triggerData: Record<string, any>;
  result?: {
    success: boolean;
    message: string;
    data?: any;
  };
  error?: string;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'inventory' | 'livestock' | 'crops' | 'finance' | 'maintenance' | 'weather';
  icon: string;
  template: Partial<AutomationRule>;
}

const automationTemplates: AutomationTemplate[] = [
  {
    id: 'low-stock-alert',
    name: 'Low Stock Alert',
    description: 'Automatically notify when inventory items fall below threshold',
    category: 'inventory',
    icon: '📦',
    template: {
      trigger: {
        type: 'threshold',
        config: { field: 'quantity', operator: 'less_than', value: 10 },
      },
      conditions: [],
      actions: [
        {
          type: 'send_notification',
          config: { message: 'Low stock alert for {item_name}', priority: 'high' },
        },
        {
          type: 'create_task',
          config: {
            title: 'Restock {item_name}',
            priority: 'medium',
            assignTo: 'inventory_manager',
          },
        },
      ],
    },
  },
  {
    id: 'animal-health-check',
    name: 'Animal Health Monitoring',
    description: 'Schedule regular health checks for livestock',
    category: 'livestock',
    icon: '🐄',
    template: {
      trigger: {
        type: 'schedule',
        config: { frequency: 'weekly', dayOfWeek: 1, time: '09:00' },
      },
      conditions: [{ field: 'animal_type', operator: 'equals', value: 'livestock' }],
      actions: [
        {
          type: 'create_task',
          config: { title: 'Weekly health check', priority: 'medium', assignTo: 'veterinarian' },
        },
      ],
    },
  },
  {
    id: 'crop-harvest-reminder',
    name: 'Crop Harvest Reminder',
    description: 'Notify when crops are ready for harvest',
    category: 'crops',
    icon: '🌾',
    template: {
      trigger: {
        type: 'condition',
        config: { field: 'growth_stage', operator: 'equals', value: 'mature' },
      },
      actions: [
        {
          type: 'send_notification',
          config: { message: 'Crop {crop_name} is ready for harvest', priority: 'high' },
        },
        {
          type: 'create_task',
          config: { title: 'Harvest {crop_name}', priority: 'high', assignTo: 'farm_manager' },
        },
      ],
    },
  },
  {
    id: 'budget-overrun-alert',
    name: 'Budget Overrun Alert',
    description: 'Alert when expenses exceed budget limits',
    category: 'finance',
    icon: '💰',
    template: {
      trigger: {
        type: 'threshold',
        config: { field: 'monthly_expenses', operator: 'greater_than', value: 5000 },
      },
      actions: [
        {
          type: 'send_notification',
          config: { message: 'Monthly expenses exceeded budget', priority: 'critical' },
        },
        {
          type: 'send_email',
          config: { recipients: ['manager@farm.com'], subject: 'Budget Alert' },
        },
      ],
    },
  },
  {
    id: 'equipment-maintenance',
    name: 'Equipment Maintenance Schedule',
    description: 'Schedule regular equipment maintenance',
    category: 'maintenance',
    icon: '🔧',
    template: {
      trigger: {
        type: 'schedule',
        config: { frequency: 'monthly', day: 1, time: '08:00' },
      },
      actions: [
        {
          type: 'create_task',
          config: { title: 'Monthly equipment maintenance', priority: 'medium' },
        },
      ],
    },
  },
  {
    id: 'weather-based-actions',
    name: 'Weather-Based Actions',
    description: 'Trigger actions based on weather conditions',
    category: 'weather',
    icon: '🌤️',
    template: {
      trigger: {
        type: 'event',
        config: { event: 'weather_update' },
      },
      conditions: [{ field: 'precipitation', operator: 'greater_than', value: 0.5 }],
      actions: [
        {
          type: 'create_task',
          config: { title: 'Check irrigation systems', priority: 'medium' },
        },
      ],
    },
  },
];

export function useSmartAutomation(farmId: number) {
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Get automation rules
  const {
    data: rules,
    isLoading: rulesLoading,
    error: rulesError,
    refetch: refetchRules,
  } = useQuery({
    queryKey: ['automation-rules', farmId],
    queryFn: async () => {
      const response = await fetch(`/api/automation/rules?farm_id=${farmId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch automation rules');
      }

      return response.json() as Promise<AutomationRule[]>;
    },
    enabled: isAuthenticated(),
  });

  // Get execution history
  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ['automation-executions', farmId],
    queryFn: async () => {
      const response = await fetch(`/api/automation/executions?farm_id=${farmId}&limit=50`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch execution history');
      }

      return response.json() as Promise<AutomationExecution[]>;
    },
    enabled: isAuthenticated(),
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (
      rule: Omit<AutomationRule, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'executionCount'>
    ) => {
      const response = await fetch('/api/automation/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          ...rule,
          farm_id: farmId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create automation rule');
      }

      return response.json() as Promise<AutomationRule>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules', farmId] });
    },
  });

  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AutomationRule> }) => {
      const response = await fetch(`/api/automation/rules/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update automation rule');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules', farmId] });
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/automation/rules/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete automation rule');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules', farmId] });
    },
  });

  // Execute rule manually
  const executeRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const response = await fetch(`/api/automation/rules/${ruleId}/execute`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to execute automation rule');
      }

      return response.json() as Promise<AutomationExecution>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-executions', farmId] });
    },
  });

  const createRuleFromTemplate = useCallback(
    (template: AutomationTemplate, customizations: Partial<AutomationRule>) => {
      const rule: Omit<
        AutomationRule,
        'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'executionCount'
      > = {
        name: template.name,
        description: template.description,
        enabled: true,
        priority: 'medium',
        trigger: template.template.trigger || { type: 'event', config: {} },
        conditions: template.template.conditions || [],
        actions: template.template.actions || [],
        ...customizations,
      };

      createRuleMutation.mutate(rule);
    },
    [createRuleMutation]
  );

  const toggleRule = useCallback(
    (ruleId: string, enabled: boolean) => {
      updateRuleMutation.mutate({ id: ruleId, updates: { enabled, updatedAt: new Date() } });
    },
    [updateRuleMutation]
  );

  const duplicateRule = useCallback(
    (rule: AutomationRule) => {
      const duplicatedRule: Omit<
        AutomationRule,
        'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'executionCount'
      > = {
        ...rule,
        name: `${rule.name} (Copy)`,
        enabled: false,
      };

      delete (duplicatedRule as any).id;
      delete (duplicatedRule as any).createdBy;
      delete (duplicatedRule as any).createdAt;
      delete (duplicatedRule as any).updatedAt;
      delete (duplicatedRule as any).executionCount;

      createRuleMutation.mutate(duplicatedRule);
    },
    [createRuleMutation]
  );

  const testRule = useCallback(
    (rule: AutomationRule) => {
      // Create a test execution with mock data
      const testExecution: Omit<
        AutomationExecution,
        'id' | 'startTime' | 'endTime' | 'result' | 'error'
      > = {
        ruleId: rule.id,
        ruleName: rule.name,
        status: 'pending',
        triggerData: { test: true, timestamp: new Date().toISOString() },
      };

      return executeRuleMutation.mutateAsync(rule.id);
    },
    [executeRuleMutation]
  );

  const getRuleStats = useCallback(() => {
    if (!rules)
      return { total: 0, enabled: 0, disabled: 0, byPriority: {} as Record<string, number> };

    const stats = {
      total: rules.length,
      enabled: rules.filter(r => r.enabled).length,
      disabled: rules.filter(r => !r.enabled).length,
      byPriority: {} as Record<string, number>,
    };

    rules.forEach(rule => {
      stats.byPriority[rule.priority] = (stats.byPriority[rule.priority] || 0) + 1;
    });

    return stats;
  }, [rules]);

  const getExecutionStats = useCallback(() => {
    if (!executions) return { total: 0, successful: 0, failed: 0, running: 0 };

    return {
      total: executions.length,
      successful: executions.filter(e => e.status === 'completed').length,
      failed: executions.filter(e => e.status === 'failed').length,
      running: executions.filter(e => e.status === 'running').length,
    };
  }, [executions]);

  const validateRule = useCallback(
    (rule: Partial<AutomationRule>): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (!rule.name?.trim()) {
        errors.push('Rule name is required');
      }

      if (!rule.trigger?.type) {
        errors.push('Trigger type is required');
      }

      if (!rule.actions || rule.actions.length === 0) {
        errors.push('At least one action is required');
      }

      // Validate trigger config
      if (
        rule.trigger?.type === 'threshold' &&
        (!rule.trigger.config?.field || !rule.trigger.config?.operator)
      ) {
        errors.push('Threshold trigger requires field and operator');
      }

      if (rule.trigger?.type === 'schedule' && !rule.trigger.config?.frequency) {
        errors.push('Schedule trigger requires frequency');
      }

      // Validate actions
      rule.actions?.forEach((action, index) => {
        if (
          action.type === 'send_email' &&
          (!action.config?.recipients || action.config.recipients.length === 0)
        ) {
          errors.push(`Email action ${index + 1} requires recipients`);
        }
        if (action.type === 'create_task' && !action.config?.title) {
          errors.push(`Task action ${index + 1} requires title`);
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    []
  );

  return {
    // Data
    rules: rules || [],
    executions: executions || [],
    templates: automationTemplates,
    isLoading: rulesLoading || executionsLoading,
    error: rulesError,

    // Stats
    ruleStats: getRuleStats(),
    executionStats: getExecutionStats(),

    // Mutations
    createRule: createRuleMutation.mutate,
    updateRule: updateRuleMutation.mutate,
    deleteRule: deleteRuleMutation.mutate,
    executeRule: executeRuleMutation.mutate,

    // Actions
    createRuleFromTemplate,
    toggleRule,
    duplicateRule,
    testRule,
    validateRule,
    refetchRules,

    // Status
    isCreating: createRuleMutation.isPending,
    isUpdating: updateRuleMutation.isPending,
    isDeleting: deleteRuleMutation.isPending,
    isExecuting: executeRuleMutation.isPending,
  };
}
