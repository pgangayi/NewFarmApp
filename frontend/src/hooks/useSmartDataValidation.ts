// Smart data validation hook for unified CRUD operations
// Provides data validation and sanitization services

import { useCallback } from 'react';

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[] | undefined;
  autoFixesApplied?: boolean;
}

export interface ValidationContext {
  entityType: string;
  operation: 'create' | 'update' | 'delete' | 'list' | 'import';
  data: unknown;
  timestamp: Date;
}

const entityValidationRules: Record<string, (data: Record<string, unknown>) => ValidationError[]> =
  {
    farm: data => {
      const errors: ValidationError[] = [];
      if (!data['name'] || typeof data['name'] !== 'string') {
        errors.push({ field: 'name', message: 'Farm name is required', code: 'REQUIRED_FIELD' });
      }
      return errors;
    },
    field: data => {
      const errors: ValidationError[] = [];
      if (!data['name'] || typeof data['name'] !== 'string') {
        errors.push({ field: 'name', message: 'Field name is required', code: 'REQUIRED_FIELD' });
      }
      if (!data['farm_id']) {
        errors.push({ field: 'farm_id', message: 'Farm ID is required', code: 'REQUIRED_FIELD' });
      }
      return errors;
    },
    task: data => {
      const errors: ValidationError[] = [];
      if (!data['title'] || typeof data['title'] !== 'string') {
        errors.push({ field: 'title', message: 'Task title is required', code: 'REQUIRED_FIELD' });
      }
      return errors;
    },
    crop: data => {
      const errors: ValidationError[] = [];
      if (!data['name'] || typeof data['name'] !== 'string') {
        errors.push({ field: 'name', message: 'Crop name is required', code: 'REQUIRED_FIELD' });
      }
      return errors;
    },
    inventory: data => {
      const errors: ValidationError[] = [];
      if (!data['name'] || typeof data['name'] !== 'string') {
        errors.push({
          field: 'name',
          message: 'Inventory item name is required',
          code: 'REQUIRED_FIELD',
        });
      }
      return errors;
    },
  };

export function useSmartDataValidation() {
  const validateData = useCallback(
    async (data: unknown, context: ValidationContext): Promise<ValidationResult> => {
      const errors: ValidationError[] = [];
      const warnings: ValidationError[] = [];

      // Basic validation for common data types
      if (context.operation === 'create' || context.operation === 'update') {
        if (typeof data === 'object' && data !== null) {
          const dataObj = data as Record<string, unknown>;

          const rules = entityValidationRules[context.entityType];
          if (rules) {
            errors.push(...rules(dataObj));
          } else {
            // Generic validation for unknown entity types
            warnings.push({
              field: 'general',
              message: `No specific validation rules for ${context.entityType}`,
              code: 'NO_VALIDATION_RULES',
            });
          }

          // Check for suspicious patterns
          if (dataObj['name'] && typeof dataObj['name'] === 'string') {
            if (dataObj['name'].length > 255) {
              warnings.push({
                field: 'name',
                message: 'Name is very long, consider shortening',
                code: 'LONG_FIELD',
              });
            }
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    },
    []
  );

  return {
    validateData,
  };
}

export default useSmartDataValidation;
