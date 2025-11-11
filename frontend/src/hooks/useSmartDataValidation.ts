// Smart data validation system for comprehensive farm data integrity
// Provides intelligent validation, error detection, and auto-correction capabilities

import { useState, useCallback, useRef, useMemo } from 'react';
import { z, ZodError, ZodSchema } from 'zod';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
  suggestions?: string[];
  autoFixable?: boolean;
  value: unknown;
  expected?: unknown;
}

export interface ValidationRule {
  field: string;
  schema: ZodSchema;
  required: boolean;
  customValidation?: (value: unknown, data: unknown) => ValidationError | null;
  dependencies?: string[]; // Fields this validation depends on
  autoFix?: (value: unknown, data: unknown) => unknown;
}

export interface ValidationContext {
  entityType: 'animal' | 'crop' | 'task' | 'inventory' | 'farm' | 'user' | 'weather';
  operation: 'create' | 'update' | 'import' | 'bulk';
  data: unknown;
  previousData?: unknown;
  userId?: string;
  farmId?: string;
  timestamp: Date;
}

export interface SmartValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: ValidationError[];
  autoFixesApplied: boolean;
  confidence: number; // 0-1 score of data quality
  qualityScore: number; // 0-100 overall quality score
  processingTime: number;
  dataInsights: {
    completeness: number;
    accuracy: number;
    consistency: number;
    timeliness: number;
  };
}

// Field validation schemas
const validationSchemas = {
  // Common fields
  id: z.string().uuid().or(z.string().min(1)),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  created_at: z.date().or(z.string().datetime()),
  updated_at: z.date().or(z.string().datetime()),
  status: z.enum(['active', 'inactive', 'pending', 'completed', 'archived']),
  is_active: z.boolean().or(z.string().transform(val => val === 'true')),

  // Animal-specific
  species: z.enum(['cattle', 'sheep', 'goats', 'pigs', 'chickens', 'horses', 'other']),
  breed: z.string().min(1, 'Breed is required'),
  age: z.number().min(0, 'Age cannot be negative').max(50, 'Age unrealistic'),
  weight: z.number().min(0, 'Weight cannot be negative').max(2000, 'Weight unrealistic'),
  health_status: z.enum(['healthy', 'sick', 'injured', 'pregnant', 'quarantined']),
  vaccination_status: z.object({
    up_to_date: z.boolean(),
    last_vaccination: z.date().optional(),
    next_due: z.date().optional(),
    vaccines: z.array(z.string()),
  }),
  last_health_check: z.date().or(z.string().datetime()).optional(),

  // Crop-specific
  crop_type: z.enum([
    'corn',
    'wheat',
    'soybeans',
    'rice',
    'potatoes',
    'tomatoes',
    'lettuce',
    'other',
  ]),
  variety: z.string().min(1, 'Variety is required'),
  planting_date: z.date().or(z.string().datetime()),
  harvest_date: z.date().or(z.string().datetime()).optional(),
  yield: z.number().min(0, 'Yield cannot be negative').optional(),
  growth_stage: z.enum([
    'seed',
    'germination',
    'vegetative',
    'flowering',
    'fruiting',
    'mature',
    'harvested',
  ]),
  field_id: z.string().min(1, 'Field is required'),

  // Task-specific
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignee: z.string().min(1, 'Assignee is required'),
  due_date: z.date().or(z.string().datetime()),
  completed_at: z.date().or(z.string().datetime()).optional(),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).default([]),

  // Inventory-specific
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  unit: z.enum(['kg', 'lbs', 'liters', 'gallons', 'pieces', 'boxes', 'bags']),
  cost_per_unit: z.number().min(0, 'Cost cannot be negative').optional(),
  supplier: z.string().optional(),
  expiration_date: z.date().or(z.string().datetime()).optional(),
  min_stock: z.number().min(0, 'Minimum stock cannot be negative'),

  // Weather-specific
  temperature: z.number().min(-50, 'Temperature too low').max(60, 'Temperature too high'),
  humidity: z
    .number()
    .min(0, 'Humidity cannot be negative')
    .max(100, 'Humidity cannot exceed 100%'),
  rainfall: z.number().min(0, 'Rainfall cannot be negative'),
  wind_speed: z.number().min(0, 'Wind speed cannot be negative'),
  condition: z.enum(['sunny', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy']),
};

// Custom validation rules
const customValidationRules: Record<
  string,
  (value: unknown, data: unknown) => ValidationError | null
> = {
  // Age and weight correlation for animals
  age_weight_correlation: (value, data) => {
    if (data.species === 'cattle' && data.age && data.weight) {
      const expectedWeight = data.age * 200; // Rough estimate
      if (Math.abs(data.weight - expectedWeight) > expectedWeight * 0.5) {
        return {
          field: 'weight',
          message: `Weight seems inconsistent with age for cattle`,
          code: 'age_weight_mismatch',
          severity: 'warning',
          suggestions: ['Verify weight measurement', 'Check age calculation'],
          value: data.weight,
          expected: expectedWeight,
        };
      }
    }
    return null;
  },

  // Harvest date validation
  harvest_date_logic: (value, data) => {
    if (data.planting_date && data.harvest_date) {
      const planting = new Date(data.planting_date);
      const harvest = new Date(data.harvest_date);
      const daysDiff = (harvest.getTime() - planting.getTime()) / (1000 * 60 * 60 * 24);

      // Crop-specific growing periods
      const minDays = {
        lettuce: 30,
        tomatoes: 60,
        corn: 90,
        wheat: 120,
        potatoes: 90,
      };

      const cropMinDays = minDays[data.crop_type as keyof typeof minDays] || 60;

      if (daysDiff < cropMinDays) {
        return {
          field: 'harvest_date',
          message: `Harvest date seems too early for ${data.crop_type}`,
          code: 'harvest_too_early',
          severity: 'warning',
          suggestions: ['Verify harvest date', 'Check planting date'],
          value: data.harvest_date,
          expected: new Date(planting.getTime() + cropMinDays * 24 * 60 * 60 * 1000),
        };
      }
    }
    return null;
  },

  // Task due date validation
  task_due_date_logic: (value, data) => {
    if (data.due_date && data.priority) {
      const dueDate = new Date(data.due_date);
      const now = new Date();
      const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      const minDaysByPriority = {
        urgent: 1,
        high: 3,
        medium: 7,
        low: 14,
      };

      const minDays = minDaysByPriority[data.priority];

      if (daysUntilDue < -1) {
        return {
          field: 'due_date',
          message: `Task is overdue`,
          code: 'task_overdue',
          severity: 'error',
          suggestions: ['Update due date', 'Mark as completed', 'Reassign task'],
          value: data.due_date,
        };
      } else if (daysUntilDue < minDays && data.priority !== 'urgent') {
        return {
          field: 'due_date',
          message: `Due date might be too soon for ${data.priority} priority`,
          code: 'due_date_too_soon',
          severity: 'warning',
          suggestions: ['Consider extending due date', 'Increase priority if needed'],
          value: data.due_date,
        };
      }
    }
    return null;
  },

  // Inventory stock level validation
  inventory_stock_level: (value, data) => {
    if (data.quantity !== undefined && data.min_stock !== undefined) {
      if (data.quantity <= data.min_stock) {
        return {
          field: 'quantity',
          message: `Stock is at or below minimum level`,
          code: 'low_stock',
          severity: data.quantity === 0 ? 'error' : 'warning',
          suggestions: ['Reorder item', 'Update minimum stock level', 'Check supplier'],
          value: data.quantity,
          expected: data.min_stock * 2,
        };
      }
    }
    return null;
  },

  // Weather data plausibility
  weather_plausibility: (value, data) => {
    if (data.temperature !== undefined && data.condition) {
      const temp = data.temperature;
      const condition = data.condition;

      // Check temperature vs condition consistency
      if (condition === 'snowy' && temp > 5) {
        return {
          field: 'condition',
          message: 'Snowy condition at above-freezing temperature',
          code: 'weather_inconsistency',
          severity: 'warning',
          suggestions: ['Verify temperature reading', 'Check weather condition'],
          value: condition,
        };
      }

      if (condition === 'sunny' && data.humidity && data.humidity > 90) {
        return {
          field: 'humidity',
          message: 'Very high humidity with sunny condition',
          code: 'humidity_inconsistency',
          severity: 'info',
          suggestions: ['Verify humidity reading'],
          value: data.humidity,
        };
      }
    }
    return null;
  },
};

export function useSmartDataValidation() {
  const [validationHistory, setValidationHistory] = useState<
    Array<{
      timestamp: Date;
      context: ValidationContext;
      result: SmartValidationResult;
    }>
  >([]);

  const validationCache = useRef<Map<string, SmartValidationResult>>(new Map());

  // Get validation rules for entity type
  const getValidationRules = useCallback((entityType: string): ValidationRule[] => {
    const baseRules: ValidationRule[] = [
      { field: 'id', schema: validationSchemas.id, required: true },
      { field: 'name', schema: validationSchemas.name, required: true },
      { field: 'status', schema: validationSchemas.status, required: true },
      { field: 'created_at', schema: validationSchemas.created_at, required: true },
      { field: 'updated_at', schema: validationSchemas.updated_at, required: true },
    ];

    const entitySpecificRules: Record<string, ValidationRule[]> = {
      animal: [
        { field: 'species', schema: validationSchemas.species, required: true },
        { field: 'breed', schema: validationSchemas.breed, required: true },
        { field: 'age', schema: validationSchemas.age, required: false },
        { field: 'weight', schema: validationSchemas.weight, required: false },
        { field: 'health_status', schema: validationSchemas.health_status, required: true },
        {
          field: 'last_health_check',
          schema: validationSchemas.last_health_check,
          required: false,
        },
      ],
      crop: [
        { field: 'crop_type', schema: validationSchemas.crop_type, required: true },
        { field: 'variety', schema: validationSchemas.variety, required: true },
        { field: 'planting_date', schema: validationSchemas.planting_date, required: true },
        { field: 'harvest_date', schema: validationSchemas.harvest_date, required: false },
        { field: 'yield', schema: validationSchemas.yield, required: false },
        { field: 'growth_stage', schema: validationSchemas.growth_stage, required: true },
        { field: 'field_id', schema: validationSchemas.field_id, required: true },
      ],
      task: [
        { field: 'priority', schema: validationSchemas.priority, required: true },
        { field: 'assignee', schema: validationSchemas.assignee, required: true },
        { field: 'due_date', schema: validationSchemas.due_date, required: true },
        { field: 'completed_at', schema: validationSchemas.completed_at, required: false },
        { field: 'category', schema: validationSchemas.category, required: true },
        { field: 'tags', schema: validationSchemas.tags, required: false },
      ],
      inventory: [
        { field: 'quantity', schema: validationSchemas.quantity, required: true },
        { field: 'unit', schema: validationSchemas.unit, required: true },
        { field: 'cost_per_unit', schema: validationSchemas.cost_per_unit, required: false },
        { field: 'supplier', schema: validationSchemas.supplier, required: false },
        { field: 'expiration_date', schema: validationSchemas.expiration_date, required: false },
        { field: 'min_stock', schema: validationSchemas.min_stock, required: true },
      ],
      weather: [
        { field: 'temperature', schema: validationSchemas.temperature, required: true },
        { field: 'humidity', schema: validationSchemas.humidity, required: true },
        { field: 'rainfall', schema: validationSchemas.rainfall, required: true },
        { field: 'wind_speed', schema: validationSchemas.wind_speed, required: true },
        { field: 'condition', schema: validationSchemas.condition, required: true },
      ],
    };

    return [...baseRules, ...(entitySpecificRules[entityType] || [])];
  }, []);

  // Main validation function
  const validateData = useCallback(
    async (data: unknown, context: ValidationContext): Promise<SmartValidationResult> => {
      const startTime = Date.now();

      // Check cache first
      const cacheKey = JSON.stringify({ data, context });
      if (validationCache.current.has(cacheKey)) {
        return validationCache.current.get(cacheKey)!;
      }

      const errors: ValidationError[] = [];
      const warnings: ValidationError[] = [];
      const suggestions: ValidationError[] = [];
      let autoFixesApplied = false;

      // Get validation rules for entity type
      const validationRules = getValidationRules(context.entityType);

      // Basic schema validation
      for (const rule of validationRules) {
        const fieldValue = data[rule.field];

        // Check required fields
        if (
          rule.required &&
          (fieldValue === undefined || fieldValue === null || fieldValue === '')
        ) {
          errors.push({
            field: rule.field,
            message: `${rule.field} is required`,
            code: 'required_field_missing',
            severity: 'error',
            value: fieldValue,
          });
          continue;
        }

        // Skip validation if field is empty and not required
        if (
          !rule.required &&
          (fieldValue === undefined || fieldValue === null || fieldValue === '')
        ) {
          continue;
        }

        // Schema validation
        try {
          const parsedValue = rule.schema.parse(fieldValue);
          // Auto-fix if needed
          if (parsedValue !== fieldValue && rule.autoFix) {
            data[rule.field] = rule.autoFix(fieldValue, data);
            autoFixesApplied = true;
          }
        } catch (error) {
          if (error instanceof ZodError) {
            const fieldErrors = error.errors.map(err => ({
              field: rule.field,
              message: err.message,
              code: 'schema_validation_error',
              severity: 'error' as const,
              value: fieldValue,
            }));
            errors.push(...fieldErrors);
          }
        }
      }

      // Custom validation rules
      const customRules = Object.keys(customValidationRules);
      for (const ruleName of customRules) {
        // Only apply relevant rules based on entity type
        const isRelevant = isRuleRelevant(ruleName, context.entityType);
        if (!isRelevant) continue;

        const customRule = customValidationRules[ruleName];
        const validationError = customRule(data[ruleName.split('_')[0]], data);

        if (validationError) {
          if (validationError.severity === 'error') {
            errors.push(validationError);
          } else if (validationError.severity === 'warning') {
            warnings.push(validationError);
          } else {
            suggestions.push(validationError);
          }
        }
      }

      // Calculate quality metrics
      const qualityMetrics = calculateQualityMetrics(data, errors, warnings, suggestions);

      const result: SmartValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
        autoFixesApplied,
        confidence: calculateConfidenceScore(errors, warnings, suggestions),
        qualityScore: qualityMetrics.overall,
        processingTime: Date.now() - startTime,
        dataInsights: qualityMetrics,
      };

      // Cache result
      validationCache.current.set(cacheKey, result);

      // Add to history
      setValidationHistory(prev => [
        ...prev.slice(-99), // Keep last 100
        { timestamp: new Date(), context, result },
      ]);

      return result;
    },
    [getValidationRules]
  );

  // Batch validation for multiple records
  const validateBatch = useCallback(
    async (
      records: unknown[],
      context: Omit<ValidationContext, 'data'>
    ): Promise<Array<{ index: number; result: SmartValidationResult }>> => {
      const results = [];

      for (let i = 0; i < records.length; i++) {
        const recordContext = { ...context, data: records[i] };
        const result = await validateData(records[i], recordContext);
        results.push({ index: i, result });
      }

      return results;
    },
    [validateData]
  );

  // Get validation suggestions for fixing errors
  const getFixSuggestions = useCallback((error: ValidationError): string[] => {
    const suggestions: Record<string, string[]> = {
      required_field_missing: [
        'Provide a value for this field',
        'Set the field to a default value if appropriate',
        "Remove the field if it's not needed",
      ],
      schema_validation_error: [
        'Check the data format matches the expected type',
        'Verify the value is within acceptable ranges',
        'Use the suggested format in error message',
      ],
      age_weight_mismatch: [
        "Re-check the animal's weight measurement",
        'Verify the age calculation',
        'Update either age or weight to be consistent',
      ],
      harvest_too_early: [
        'Verify the harvest date is correct',
        'Check the planting date accuracy',
        'Consider if this is an early variety',
      ],
      task_overdue: [
        'Mark the task as completed',
        'Extend the due date if needed',
        'Reassign to another person',
      ],
      low_stock: [
        'Place a reorder with the supplier',
        'Update the minimum stock level',
        'Check if the quantity is accurate',
      ],
      weather_inconsistency: [
        'Re-check the temperature reading',
        'Verify the weather condition',
        'Update the condition to match temperature',
      ],
    };

    return suggestions[error.code] || ['Review the data and try again'];
  }, []);

  // Auto-fix common issues
  const autoFixData = useCallback((data: unknown, errors: ValidationError[]): unknown => {
    const fixedData = { ...data };
    let hasChanges = false;

    for (const error of errors) {
      if (!error.autoFixable) continue;

      switch (error.code) {
        case 'schema_validation_error':
          // Try to convert types
          if (typeof error.value === 'string') {
            if (error.field.includes('date')) {
              const date = new Date(error.value);
              if (!isNaN(date.getTime())) {
                fixedData[error.field] = date;
                hasChanges = true;
              }
            } else if (error.field === 'is_active') {
              const boolValue = error.value.toLowerCase() === 'true' || error.value === '1';
              fixedData[error.field] = boolValue;
              hasChanges = true;
            }
          }
          break;

        case 'required_field_missing':
          // Set sensible defaults
          if (error.field === 'status') {
            fixedData[error.field] = 'active';
            hasChanges = true;
          } else if (error.field === 'updated_at') {
            fixedData[error.field] = new Date();
            hasChanges = true;
          }
          break;
      }
    }

    return hasChanges ? fixedData : data;
  }, []);

  // Check if rule is relevant to entity type
  const isRuleRelevant = useCallback((ruleName: string, entityType: string): boolean => {
    const ruleEntityMap: Record<string, string[]> = {
      age_weight_correlation: ['animal'],
      harvest_date_logic: ['crop'],
      task_due_date_logic: ['task'],
      inventory_stock_level: ['inventory'],
      weather_plausibility: ['weather'],
    };

    return ruleEntityMap[ruleName]?.includes(entityType) || false;
  }, []);

  // Calculate data quality metrics
  const calculateQualityMetrics = useCallback(
    (
      data: unknown,
      errors: ValidationError[],
      warnings: ValidationError[],
      suggestions: ValidationError[]
    ) => {
      const totalFields = Object.keys(data).length;
      const requiredFields = 10; // Approximate
      const missingRequired = errors.filter(e => e.code === 'required_field_missing').length;
      const schemaErrors = errors.filter(e => e.code === 'schema_validation_error').length;
      const businessLogicErrors = errors.filter(
        e => e.code !== 'required_field_missing' && e.code !== 'schema_validation_error'
      ).length;

      const completeness = Math.max(0, (totalFields - missingRequired) / totalFields);
      const accuracy = Math.max(0, 1 - schemaErrors / Math.max(1, totalFields));
      const consistency = Math.max(0, 1 - businessLogicErrors / Math.max(1, totalFields));
      const timeliness = 0.9; // Placeholder - would need timestamp analysis

      const overall = Math.round(((completeness + accuracy + consistency + timeliness) / 4) * 100);

      return {
        completeness: Math.round(completeness * 100),
        accuracy: Math.round(accuracy * 100),
        consistency: Math.round(consistency * 100),
        timeliness: Math.round(timeliness * 100),
        overall,
      };
    },
    []
  );

  // Calculate confidence score
  const calculateConfidenceScore = useCallback(
    (
      errors: ValidationError[],
      warnings: ValidationError[],
      suggestions: ValidationError[]
    ): number => {
      const errorWeight = 0.7;
      const warningWeight = 0.2;
      const suggestionWeight = 0.1;

      const errorScore = Math.max(0, 1 - (errors.length * errorWeight) / 10);
      const warningScore = Math.max(0, 1 - (warnings.length * warningWeight) / 10);
      const suggestionScore = Math.max(0, 1 - (suggestions.length * suggestionWeight) / 10);

      return (errorScore + warningScore + suggestionScore) / 3;
    },
    []
  );

  // Get validation history statistics
  const getValidationStats = useCallback(() => {
    if (validationHistory.length === 0) {
      return {
        total: 0,
        errorRate: 0,
        averageProcessingTime: 0,
        averageQualityScore: 0,
        topErrorCodes: [],
      };
    }

    const total = validationHistory.length;
    const totalErrors = validationHistory.reduce((sum, h) => sum + h.result.errors.length, 0);
    const totalProcessingTime = validationHistory.reduce(
      (sum, h) => sum + h.result.processingTime,
      0
    );
    const totalQualityScore = validationHistory.reduce((sum, h) => sum + h.result.qualityScore, 0);

    const errorCodeCounts: Record<string, number> = {};
    validationHistory.forEach(h => {
      h.result.errors.forEach(error => {
        errorCodeCounts[error.code] = (errorCodeCounts[error.code] || 0) + 1;
      });
    });

    const topErrorCodes = Object.entries(errorCodeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([code, count]) => ({ code, count }));

    return {
      total,
      errorRate: totalErrors / total,
      averageProcessingTime: Math.round(totalProcessingTime / total),
      averageQualityScore: Math.round(totalQualityScore / total),
      topErrorCodes,
    };
  }, [validationHistory]);

  // Clear validation cache
  const clearCache = useCallback(() => {
    validationCache.current.clear();
  }, []);

  return {
    validateData,
    validateBatch,
    getFixSuggestions,
    autoFixData,
    getValidationStats,
    clearCache,
    validationHistory: validationHistory.slice(-10), // Return last 10
  };
}

export default useSmartDataValidation;
